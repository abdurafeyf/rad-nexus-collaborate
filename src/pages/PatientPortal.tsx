
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, MessageSquare, ChevronRight, Hospital, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NewSidebar from "@/components/NewSidebar";
import { format, parseISO } from "date-fns";
import NotificationsPanel from "@/components/patient/NotificationsPanel";

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

const PatientPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cases, setCases] = useState<CaseWithReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login/patient");
          return;
        }
        
        // Fetch patient details by email
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("id, name")
          .eq("email", user.email)
          .single();
        
        if (patientError) throw patientError;
        
        setPatientName(patientData.name);
        setPatientId(patientData.id);
        
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
          .eq("patient_id", patientData.id)
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
            patient_id: patientData.id
          };
          
          mockCases.push(demoCase);
        }
        
        setCases(mockCases);
        
        // Fetch unread notifications count
        const { count, error: countError } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patientData.id)
          .eq("read", false);
          
        if (countError) throw countError;
        
        setUnreadCount(count || 0);
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
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <NewSidebar type="patient">
        <div className="flex min-h-screen flex-col bg-gray-50">
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-coral-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </NewSidebar>
    );
  }

  return (
    <NewSidebar type="patient">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Patient Portal</h1>
                <p className="text-gray-500">Welcome back, {patientName}</p>
              </div>
              
              <Button
                variant="outline"
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {showNotifications ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  Back to Timeline
                </Button>
              </div>
              
              <NotificationsPanel />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timeline title */}
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-800">My Medical Timeline</h2>
                <p className="text-muted-foreground">All your medical cases in one place</p>
              </div>
              
              {/* Timeline */}
              <div className="space-y-4">
                {cases.length === 0 ? (
                  <Card className="border-0 shadow-subtle">
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500">No medical records found.</p>
                    </CardContent>
                  </Card>
                ) : (
                  cases.map((caseItem) => (
                    <Card 
                      key={caseItem.id}
                      className="border-0 overflow-hidden hover-card"
                    >
                      <div className={`h-1 w-full ${caseItem.status === "published" ? "bg-gradient-to-r from-teal-500 to-teal-400" : "bg-gradient-to-r from-blue-500 to-blue-400"}`}></div>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center mb-2">
                              <FileText className="h-5 w-5 text-teal-500 mr-2" />
                              <h3 className="text-lg font-medium">
                                Radiology Report
                              </h3>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-3 md:gap-5 text-sm text-gray-500 mb-4">
                              <div className="flex items-center">
                                <Hospital className="h-4 w-4 mr-1 text-gray-400" />
                                {caseItem.hospital_name}
                              </div>
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1 text-gray-400" />
                                {caseItem.doctor_name}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                {format(parseISO(caseItem.date), "PPP")}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                            {caseItem.status === "published" ? (
                              <Button
                                onClick={() => navigate(`/patient/reports/${caseItem.report_id}`)}
                                className="bg-teal-500 hover:bg-teal-600 rounded-full"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Report
                              </Button>
                            ) : (
                              <Button variant="outline" disabled className="rounded-full">
                                <FileText className="mr-2 h-4 w-4" />
                                Report Pending
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/patient/chat`)}
                              className="border-coral-200 text-coral-600 hover:bg-coral-50 hover:text-coral-700 hover:border-coral-300 rounded-full"
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Chat with Doctor
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              
              {/* Upcoming appointments card */}
              <Card className="border-0 shadow-subtle">
                <CardHeader>
                  <CardTitle className="text-xl">Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-500 py-6">
                  <p>No upcoming appointments</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 rounded-full"
                  >
                    Schedule Appointment
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </NewSidebar>
  );
};

export default PatientPortal;
