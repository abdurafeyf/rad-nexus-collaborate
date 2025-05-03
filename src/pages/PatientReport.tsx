
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Calendar, Download, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { format } from "date-fns";

type Report = {
  id: string;
  scan_id: string;
  patient_id: string;
  content: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
  hospital_name: string | null;
};

type Scan = {
  id: string;
  patient_id: string;
  file_path: string;
  file_type: string;
  uploaded_at: string;
};

const PatientReport = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        if (!reportId) return;
        
        // For demo purposes, if we're using a demo report ID
        if (reportId === 'demo-report-1') {
          const demoReport = {
            id: 'demo-report-1',
            scan_id: 'demo-scan-1',
            patient_id: '3b5a15a7-c156-4f48-9622-56c41a8b3c8e',
            content: "# Radiology Report\n\n## Patient Information\nPatient Name: John Doe\n\n## Analysis\nChest X-ray performed to evaluate for pneumonia.\n\n## Findings\nLungs are clear without focal consolidation, effusion, or pneumothorax. Heart size is normal. No pleural effusion. No acute osseous abnormality.\n\n## Impression\nNo acute cardiopulmonary process identified.",
            status: "published" as "published",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            hospital_name: "City Medical Center"
          };
          
          setReport(demoReport);
          setIsLoading(false);
          return;
        }
        
        // Fetch report data
        const { data: reportData, error: reportError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .single();
        
        if (reportError) throw reportError;
        
        // Ensure the report is published
        if (reportData.status !== "published") {
          toast({
            title: "Report not available",
            description: "This report has not been published yet.",
            variant: "destructive",
          });
          navigate("/patient/portal");
          return;
        }
        
        setReport(reportData as Report);
        
        // Fetch scan data
        const { data: scanData, error: scanError } = await supabase
          .from("scans")
          .select("*")
          .eq("id", reportData.scan_id)
          .single();
        
        if (scanError) throw scanError;
        
        setScan(scanData as Scan);
        
        // Get image URL if it's an image
        if (scanData.file_type.startsWith("image/")) {
          const { data: imageData } = await supabase.storage
            .from("scans")
            .getPublicUrl(scanData.file_path);
          
          setImageUrl(imageData.publicUrl);
        }
        
      } catch (error: any) {
        toast({
          title: "Error loading report",
          description: error.message,
          variant: "destructive",
        });
        navigate("/patient/portal");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportId]);

  const renderMarkdown = (markdown: string) => {
    // A very simple markdown parser for headings and paragraphs
    return markdown
      .split("\n")
      .map((line, index) => {
        if (line.startsWith("# ")) {
          return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
        } else if (line.startsWith("## ")) {
          return <h2 key={index} className="text-xl font-semibold mt-3 mb-2">{line.substring(3)}</h2>;
        } else if (line.startsWith("### ")) {
          return <h3 key={index} className="text-lg font-medium mt-2 mb-1">{line.substring(4)}</h3>;
        } else if (line.trim() === "") {
          return <br key={index} />;
        } else {
          return <p key={index} className="mb-2">{line}</p>;
        }
      });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <NavBar />
        <main className="flex-grow container mx-auto py-8 px-4">
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <NavBar />
        <main className="flex-grow container mx-auto py-8 px-4">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
            <Button onClick={() => navigate("/patient/portal")}>
              Return to Portal
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <NavBar />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/patient/portal")}
          className="mb-6 -ml-3 print:hidden"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Portal
        </Button>
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between print:hidden">
          <h1 className="text-3xl font-bold">Radiology Report</h1>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print Report
            </Button>
            
            <Button
              onClick={() => navigate(`/patient/chat`)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat with Doctor
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Report */}
          <Card className="lg:col-span-2 print:shadow-none print:border-none">
            <CardHeader className="print:pb-0">
              <CardTitle className="flex items-center justify-between">
                <span>Radiology Report</span>
                {report.hospital_name && (
                  <span className="text-sm font-normal text-gray-500">
                    {report.hospital_name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              {renderMarkdown(report.content)}
            </CardContent>
          </Card>
          
          {/* Sidebar */}
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imageUrl && (
                  <div>
                    <p className="font-medium mb-2">Scan Image</p>
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt="Radiography scan" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
                
                {report.published_at && (
                  <div>
                    <p className="font-medium mb-1">Published Date</p>
                    <p className="flex items-center text-sm text-gray-600">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(new Date(report.published_at), "PPPP")}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="font-medium mb-1">Doctor</p>
                  <p className="text-sm text-gray-600">
                    Dr. Sarah Johnson
                  </p>
                </div>
                
                {report.hospital_name && (
                  <div>
                    <p className="font-medium mb-1">Institution</p>
                    <p className="text-sm text-gray-600">
                      {report.hospital_name}
                    </p>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button variant="outline" className="w-full" disabled={!imageUrl}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PatientReport;
