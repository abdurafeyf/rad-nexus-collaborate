import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, MessageSquare, ChevronRight, Download, Upload, Phone, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NewSidebar from "@/components/NewSidebar";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationsPanel from "@/components/patient/NotificationsPanel";
import PatientProfilePanel from "@/components/patient/PatientProfilePanel";
import QuickActionsPanel from "@/components/patient/QuickActionsPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type CaseWithReport = {
  id: string;
  report_id: string;
  hospital_name: string | null;
  doctor_name: string;
  title: string;
  date: string;
  status: string;
  scan_id: string;
  patient_id: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

type DoctorData = {
  first_name?: string;
  last_name?: string;
};

const PatientPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [cases, setCases] = useState<CaseWithReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    unreadMessages: 0,
    pendingForms: 0
  });
  
  // Function to get friendly status badge color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to get friendly status label
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'draft': return 'Draft Report';
      case 'reviewing': return 'Reviewing';
      case 'published': return 'Published';
      default: return status;
    }
  };

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
        
        // Fetch reports with proper nested query structure
        const { data: reportData, error: reportError } = await supabase
          .from("reports")
          .select(`
            id,
            scan_id,
            patient_id,
            hospital_name,
            status,
            published_at,
            created_at,
            scans (
              doctor_id,
              doctors:doctor_id (
                first_name,
                last_name
              )
            )
          `)
          .eq("patient_id", patientData.id)
          .order("created_at", { ascending: false });
        
        if (reportError) throw reportError;
        
        // Format the case data
        const formattedCases: CaseWithReport[] = reportData.map((report) => {
          const reportDate = report.published_at || report.created_at;
          const title = `Radiology Report - ${format(parseISO(reportDate), "MMM d, yyyy")}`;
          
          // Get doctor name if available
          let doctorName = "Unknown Doctor";
          if (report.scans && report.scans.doctors && typeof report.scans.doctors === 'object') {
            const doctorData = report.scans.doctors as DoctorData;
            if (doctorData.first_name && doctorData.last_name) {
              doctorName = `Dr. ${doctorData.first_name} ${doctorData.last_name}`;
            }
          }
          
          return {
            id: `case-${report.id}`,
            report_id: report.id,
            hospital_name: report.hospital_name || "General Hospital",
            doctor_name: doctorName,
            title: title,
            date: reportDate,
            status: report.status,
            scan_id: report.scan_id,
            patient_id: report.patient_id
          };
        });
        
        setCases(formattedCases);
        
        // Fetch notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from("notifications")
          .select("*")
          .eq("patient_id", patientData.id)
          .order("created_at", { ascending: false });
          
        if (notificationsError) throw notificationsError;
        
        setNotifications(notificationsData || []);
        
        // Calculate unread notifications count
        const unreadNotifications = notificationsData?.filter(n => !n.read) || [];
        setUnreadCount(unreadNotifications.length);
        
        // Fetch unread messages count
        const { data: messagesData, error: messagesError } = await supabase
          .from("chats")
          .select("id")
          .eq("patient_id", patientData.id)
          .eq("sender_type", "doctor")
          .order("created_at", { ascending: false })
          .limit(10);
          
        const unreadMessages = messagesData?.length || 0;
        
        // Set summary stats
        setStats({
          totalCases: formattedCases.length,
          unreadMessages: unreadMessages,
          pendingForms: unreadNotifications.filter(n => n.title.includes("consent") || n.message.includes("consent")).length
        });
        
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
            <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </NewSidebar>
    );
  }

  // Determine if there's any urgent notification that should be shown as an alert
  const urgentNotifications = notifications.filter(
    (n) => !n.read && (n.title.includes("ready") || n.title.includes("consent") || n.message.includes("consent"))
  );

  return (
    <NewSidebar type="patient">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 md:p-8">
          {/* Page header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1 text-gray-900">
                Welcome, <span className="border-b-2 border-teal-500 pb-1">{patientName}</span>
              </h1>
              <p className="text-gray-600">Track your radiology journey and healthcare records</p>
            </div>
            
            {/* Action buttons */}
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
              >
                {showProfile ? "Timeline" : "Profile"}
              </Button>
            </div>
          </div>
          
          {/* Summary cards at the top */}
          {!showNotifications && !showProfile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-subtle">
                <CardContent className="p-6">
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold text-gray-900">{stats.totalCases}</span>
                    <span className="text-sm text-gray-500">Total Cases</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-subtle">
                <CardContent className="p-6">
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold text-gray-900">{stats.unreadMessages}</span>
                    <span className="text-sm text-gray-500">Unread Messages</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-subtle">
                <CardContent className="p-6">
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold text-gray-900">{stats.pendingForms}</span>
                    <span className="text-sm text-gray-500">Pending Consent Forms</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Alert banners for urgent notifications */}
          {!showNotifications && !showProfile && urgentNotifications.length > 0 && (
            <div className="mb-8 space-y-4">
              {urgentNotifications.map((notification) => (
                <Alert key={notification.id} className="border-l-4 border-teal-500 bg-teal-50">
                  <AlertTitle>{notification.title}</AlertTitle>
                  <AlertDescription className="flex justify-between items-center">
                    <span>{notification.message}</span>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNotifications(true)}
                      className="text-teal-700 border-teal-300 hover:bg-teal-100"
                    >
                      Take Action
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
          
          {/* Main content area */}
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
            {/* Timeline or notifications */}
            <div className="lg:col-span-2">
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
              ) : showProfile ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Your Profile</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowProfile(false)}
                    >
                      Back to Timeline
                    </Button>
                  </div>
                  
                  <PatientProfilePanel />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Timeline title */}
                  <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Medical Timeline</h2>
                    <p className="text-gray-600">Your case history in chronological order</p>
                  </div>
                  
                  {/* Timeline */}
                  <div className="relative space-y-6 before:absolute before:inset-0 before:left-9 before:h-full before:border-l-2 before:border-dashed before:border-gray-200 pl-12 md:pl-0 md:ml-9">
                    {cases.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">No medical records yet</h3>
                        <p className="text-gray-500 mb-4">Upload your first scan to get started</p>
                        <Button
                          onClick={() => navigate("/doctor/patients/:patientId/scan/upload")}
                          className="bg-teal-500 hover:bg-teal-600 rounded-lg"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Your First Scan
                        </Button>
                      </div>
                    ) : (
                      cases.map((caseItem, index) => (
                        <div key={caseItem.id} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-9 top-6 h-4 w-4 rounded-full bg-white border-2 border-teal-500"></div>
                          
                          {/* Case card */}
                          <Card 
                            className="border-0 overflow-hidden hover-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className={`h-1 w-full ${caseItem.status === "published" 
                              ? "bg-gradient-to-r from-teal-500 to-teal-400" 
                              : "bg-gradient-to-r from-blue-500 to-blue-400"}`}
                            ></div>
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center mb-2 gap-3">
                                    <h3 className="text-lg font-medium">
                                      {caseItem.title}
                                    </h3>
                                    <Badge className={getStatusColor(caseItem.status)}>
                                      {getStatusLabel(caseItem.status)}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex flex-col md:flex-row gap-3 md:gap-5 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                      {format(parseISO(caseItem.date), "PPP")}
                                    </div>
                                    <div className="flex items-center">
                                      {caseItem.hospital_name}
                                    </div>
                                    <div className="flex items-center">
                                      {caseItem.doctor_name}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                                  {caseItem.status === "published" ? (
                                    <Button
                                      onClick={() => navigate(`/patient/reports/${caseItem.report_id}`)}
                                      className="bg-teal-500 hover:bg-teal-600 rounded-lg group relative"
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Report
                                      
                                      {/* Download icon on hover */}
                                      <span className="absolute right-0 top-0 bottom-0 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download className="h-4 w-4 ml-2" />
                                      </span>
                                    </Button>
                                  ) : (
                                    <Button variant="outline" disabled className="rounded-lg">
                                      <FileText className="mr-2 h-4 w-4" />
                                      Report Pending
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="outline"
                                    onClick={() => navigate(`/patient/chat`)}
                                    className="border-coral-200 text-coral-600 hover:bg-coral-50 hover:text-coral-700 hover:border-coral-300 rounded-lg"
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Chat with Doctor
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar / Quick actions */}
            <div className="space-y-6 col-span-1">
              <QuickActionsPanel />
              
              {/* Upcoming appointments card */}
              <Card className="border-0 shadow-subtle">
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-500 py-6">
                  <p>No upcoming appointments</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 rounded-lg"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Appointment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Mobile Quick Actions (sticky footer) */}
          {isMobile && !showNotifications && !showProfile && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center justify-around z-10">
              <Button variant="ghost" size="sm" className="flex-col gap-1" onClick={() => navigate("/patient/chat")}>
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Messages</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex-col gap-1">
                <Phone className="h-5 w-5" />
                <span className="text-xs">Follow-Up</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex-col gap-1">
                <Upload className="h-5 w-5" />
                <span className="text-xs">Upload</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </NewSidebar>
  );
};

export default PatientPortal;
