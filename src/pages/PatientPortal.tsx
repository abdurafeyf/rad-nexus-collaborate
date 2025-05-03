
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, MessageSquare, ChevronRight, Hospital, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { format, parseISO } from "date-fns";

type CaseWithReport = {
  id: string;
  report_id: string;
  hospital_name: string | null;
  doctor_name: string;
  date: string;
  status: string;
  scan_id: string;
  patient_id: string;
};

// For demo purposes, we'll use a hardcoded patient ID
const DEMO_PATIENT_ID = "3b5a15a7-c156-4f48-9622-56c41a8b3c8e";

const PatientPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cases, setCases] = useState<CaseWithReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Fetch patient details
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("name")
          .eq("id", DEMO_PATIENT_ID)
          .single();
        
        if (patientError) throw patientError;
        
        setPatientName(patientData.name);
        
        // Fetch reports
        const { data: reportData, error: reportError } = await supabase
          .from("reports")
          .select(`
            id,
            scan_id,
            patient_id,
            hospital_name,
            status,
            published_at
          `)
          .eq("patient_id", DEMO_PATIENT_ID)
          .order("created_at", { ascending: false });
        
        if (reportError) throw reportError;
        
        // For demo purposes, we'll create mock cases
        const mockCases: CaseWithReport[] = reportData.map((report, index) => ({
          id: `case-${index}`,
          report_id: report.id,
          hospital_name: report.hospital_name || "General Hospital",
          doctor_name: "Dr. Sarah Johnson",
          date: report.published_at || new Date().toISOString(),
          status: report.status,
          scan_id: report.scan_id,
          patient_id: report.patient_id
        }));
        
        // If no cases found in the database, create some mock data
        if (mockCases.length === 0) {
          const demoCase = {
            id: "demo-case-1",
            report_id: "demo-report-1",
            hospital_name: "City Medical Center",
            doctor_name: "Dr. Sarah Johnson",
            date: new Date().toISOString(),
            status: "published",
            scan_id: "demo-scan-1",
            patient_id: DEMO_PATIENT_ID
          };
          
          mockCases.push(demoCase);
        }
        
        setCases(mockCases);
      } catch (error: any) {
        toast({
          title: "Error fetching patient data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientData();
  }, []);

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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <NavBar />
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Patient Portal</h1>
          <p className="text-gray-500">Welcome back, {patientName}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" disabled>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Button>
              <Button variant="default" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                My Medical Records
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <MessageSquare className="mr-2 h-4 w-4" />
                Messages
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Calendar className="mr-2 h-4 w-4" />
                Appointments
              </Button>
            </CardContent>
          </Card>
          
          {/* Main content */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>My Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cases.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No medical records found.</p>
                  </div>
                ) : (
                  cases.map((caseItem) => (
                    <div 
                      key={caseItem.id}
                      className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-lg font-medium mb-1">
                              Radiology Report
                            </h3>
                            <div className="flex flex-col md:flex-row gap-1 md:gap-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <Hospital className="h-4 w-4 mr-1" />
                                {caseItem.hospital_name}
                              </div>
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {caseItem.doctor_name}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {format(parseISO(caseItem.date), "PPP")}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 md:mt-0 flex flex-wrap gap-2">
                            {caseItem.status === "published" ? (
                              <Button
                                onClick={() => navigate(`/patient/reports/${caseItem.report_id}`)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Report
                              </Button>
                            ) : (
                              <Button variant="outline" disabled>
                                <FileText className="mr-2 h-4 w-4" />
                                Report Pending
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/patient/chat`)}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Chat with Doctor
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PatientPortal;
