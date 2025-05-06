import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Check, FileText, Send, Eye, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type Report = {
  id: string;
  scan_record_id: string;
  patient_id: string;
  content: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
  hospital_name: string | null;
};

type PatientDetails = {
  id: string;
  name: string;
  email: string;
};

type ScanRecord = {
  id: string;
  file_url: string;
  file_type?: string;
  scan_type: string;
};

const ReportReview = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [report, setReport] = useState<Report | null>(null);
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        if (!reportId) return;
        
        // Fetch report
        const { data: reportData, error: reportError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .single();
        
        if (reportError) throw reportError;
        setReport(reportData as Report);
        setEditedContent(reportData.content);
        
        // Fetch patient
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("id, name, email")
          .eq("id", reportData.patient_id)
          .single();
        
        if (patientError) throw patientError;
        setPatient(patientData as PatientDetails);
        
        // Fetch scan record
        const { data: scanData, error: scanError } = await supabase
          .from("scan_records")
          .select("id, file_url, scan_type")
          .eq("id", reportData.scan_record_id)
          .single();
        
        if (scanError) throw scanError;
        setScan(scanData as ScanRecord);
        
        // Get image URL if it's an image path
        if (scanData.file_url && scanData.file_url !== "placeholder.jpg") {
          const { data: imageData } = await supabase.storage
            .from("scans")
            .getPublicUrl(scanData.file_url);
          
          setImageUrl(imageData.publicUrl);
        }
        
      } catch (error: any) {
        toast({
          title: "Error loading report",
          description: error.message,
          variant: "destructive",
        });
        navigate(`/doctor/dashboard`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportId]);

  const handleSaveChanges = async () => {
    if (!report) return;
    
    try {
      const { error } = await supabase
        .from("reports")
        .update({ 
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", report.id);
      
      if (error) throw error;
      
      setReport({
        ...report,
        content: editedContent,
        updated_at: new Date().toISOString()
      });
      
      setIsEditing(false);
      setShowPreview(false);
      
      toast({
        title: "Changes saved",
        description: "Report has been updated successfully.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePublishReport = async () => {
    if (!report) return;
    
    setIsPublishing(true);
    
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from("reports")
        .update({ 
          status: "published",
          published_at: now,
          updated_at: now
        })
        .eq("id", report.id);
      
      if (error) throw error;
      
      setReport({
        ...report,
        status: "published",
        published_at: now,
        updated_at: now
      });
      
      setIsPublishDialogOpen(false);
      
      toast({
        title: "Report published",
        description: "The report is now available to the patient.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error publishing report",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
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

  if (!report || !patient) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <NavBar />
        <main className="flex-grow container mx-auto py-8 px-4">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
            <Button onClick={() => navigate("/doctor/dashboard")}>
              Return to Dashboard
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
          onClick={() => navigate(`/doctor/patients/${patient.id}`)}
          className="mb-6 -ml-3"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patient
        </Button>
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Review Radiology Report</h1>
            <p className="text-gray-500">
              Patient: {patient.name} ({patient.email})
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 space-x-3">
            {report.status === "draft" ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Done Editing
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Report
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => setIsPublishDialogOpen(true)}
                  disabled={report.status !== "draft"}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Publish to Patient
                </Button>
              </>
            ) : (
              <Button variant="outline" disabled>
                <FileText className="mr-2 h-4 w-4" />
                Published
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Report Content */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Report {report.status === "published" ? "(Published)" : "(Draft)"}</span>
                {report.hospital_name && (
                  <span className="text-sm font-normal text-gray-500">
                    {report.hospital_name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {showPreview ? (
                    <div className="border rounded-md p-4 min-h-[500px] prose max-w-none bg-gray-50">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                        rehypePlugins={[rehypeSanitize]}
                      >
                        {editedContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[500px] font-mono"
                      placeholder="Enter report content here using Markdown..."
                    />
                  )}
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? (
                        <>
                          <Code className="mr-2 h-4 w-4" />
                          Edit Markdown
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </>
                      )}
                    </Button>
                    
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditedContent(report.content);
                          setIsEditing(false);
                          setShowPreview(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveChanges}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {report.content}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Scan Image and Report Info */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imageUrl && (
                  <div>
                    <p className="font-medium mb-2">Scan Image</p>
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt="Patient scan" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="font-medium mb-1">Report Status</p>
                  <p className="text-sm">
                    {report.status === "published" ? (
                      <span className="text-green-600 font-medium">Published</span>
                    ) : (
                      <span className="text-amber-600 font-medium">Draft</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium mb-1">Created</p>
                  <p className="text-sm">
                    {format(new Date(report.created_at), "PPP p")}
                  </p>
                </div>
                
                {report.status === "published" && report.published_at && (
                  <div>
                    <p className="font-medium mb-1">Published</p>
                    <p className="text-sm">
                      {format(new Date(report.published_at), "PPP p")}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="font-medium mb-1">Last Updated</p>
                  <p className="text-sm">
                    {format(new Date(report.updated_at), "PPP p")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      
      {/* Publish Confirmation Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Report to Patient</DialogTitle>
            <DialogDescription>
              This will make the report available to the patient. Published reports cannot be edited.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Are you sure you want to publish this report for {patient.name}?
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPublishDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishReport}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Confirm & Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportReview;