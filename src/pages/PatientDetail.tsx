import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  FileText,
  MessageSquare,
  Plus,
  Upload,
  User,
} from "lucide-react";
import { format } from "date-fns";
import NewSidebar from "@/components/NewSidebar";
import PatientInfoCard from "@/components/doctor/PatientInfoCard";
import PatientScansList from "@/components/doctor/PatientScansList";
import PatientReportsList from "@/components/doctor/PatientReportsList";
import { useQuery } from "@tanstack/react-query";

type Patient = {
  id: string;
  name: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
  phone_number?: string;
  address?: string;
  medical_history?: string;
  created_at: string;
  status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_typing?: boolean;
  last_visit?: string;
  notes?: string;
  updated_at?: string;
  updated_by?: string;
};

type ScanRecord = {
  id: string;
  patient_id: string;
  file_url: string;
  scan_type: string;
  body_part: string;
  date_taken: string;
  notes: string;
  created_at: string;
};

type Report = {
  id: string;
  scan_record_id: string;
  patient_id: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string;
};

const PatientDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch patient data
  const {
    data: patient,
    isLoading: isLoadingPatient,
    error: patientError,
  } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      if (!patientId) throw new Error("No patient ID provided");

      // For demo purposes
      if (patientId === "demo-patient-1") {
        return {
          id: "demo-patient-1",
          name: "John Doe",
          email: "john.doe@example.com",
          date_of_birth: "1985-05-15",
          gender: "Male",
          phone_number: "(555) 123-4567",
          address: "123 Main St, Anytown, USA",
          medical_history: "Hypertension, Asthma",
          created_at: "2023-01-15T08:30:00Z",
        };
      }

      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      return data as Patient;
    },
    enabled: !!patientId,
  });

  // Fetch patient's scan records
  const {
    data: scanRecords,
    isLoading: isLoadingScans,
    error: scansError,
  } = useQuery({
    queryKey: ["patientScans", patientId],
    queryFn: async () => {
      if (!patientId) throw new Error("No patient ID provided");

      // For demo purposes
      if (patientId === "demo-patient-1") {
        return [
          {
            id: "demo-scan-1",
            patient_id: "demo-patient-1",
            file_url: "chest_xray.jpg",
            scan_type: "X-Ray",
            body_part: "Chest",
            date_taken: "2023-05-10T14:30:00Z",
            notes: "Routine checkup",
            created_at: "2023-05-10T15:45:00Z",
          },
        ];
      }

      const { data, error } = await supabase
        .from("scan_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch patient's reports
  const {
    data: reports,
    isLoading: isLoadingReports,
    error: reportsError,
  } = useQuery({
    queryKey: ["patientReports", patientId],
    queryFn: async () => {
      if (!patientId) throw new Error("No patient ID provided");

      // For demo purposes
      if (patientId === "demo-patient-1") {
        return [
          {
            id: "demo-report-1",
            scan_record_id: "demo-scan-1",
            patient_id: "demo-patient-1",
            content:
              "# Radiology Report\n\n## Patient Information\nPatient Name: John Doe\n\n## Analysis\nChest X-ray performed to evaluate for pneumonia.\n\n## Findings\nLungs are clear without focal consolidation, effusion, or pneumothorax. Heart size is normal. No pleural effusion. No acute osseous abnormality.\n\n## Impression\nNo acute cardiopulmonary process identified.",
            status: "published",
            created_at: "2023-05-12T10:15:00Z",
            updated_at: "2023-05-12T14:30:00Z",
            published_at: "2023-05-12T14:30:00Z",
          },
        ];
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Handle errors
  useEffect(() => {
    if (patientError) {
      toast({
        title: "Error loading patient",
        description: (patientError as Error).message,
        variant: "destructive",
      });
    }

    if (scansError) {
      toast({
        title: "Error loading scans",
        description: (scansError as Error).message,
        variant: "destructive",
      });
    }

    if (reportsError) {
      toast({
        title: "Error loading reports",
        description: (reportsError as Error).message,
        variant: "destructive",
      });
    }
  }, [patientError, scansError, reportsError]);

  if (isLoadingPatient) {
    return (
      <NewSidebar type="doctor">
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </NewSidebar>
    );
  }

  if (!patient) {
    return (
      <NewSidebar type="doctor">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Patient Not Found</h2>
            <Button onClick={() => navigate("/doctor/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </NewSidebar>
    );
  }

  return (
    <NewSidebar type="doctor">
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/doctor/dashboard")}
          className="mb-6 -ml-3"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">{patient.name}</h1>
            <p className="text-gray-500">Patient ID: {patient.id}</p>
          </div>

          <div className="mt-4 md:mt-0 space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/doctor/patients/${patientId}/chat`)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Patient
            </Button>
            <Button onClick={() => navigate(`/doctor/patients/${patientId}/scan`)}>
              <Plus className="mr-2 h-4 w-4" />
              New Scan
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-white border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">
              Overview
            </TabsTrigger>
            <TabsTrigger value="scans" className="data-[state=active]:bg-gray-100">
              Scans
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gray-100">
              Reports
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-100">
              Medical History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PatientInfoCard patient={patient} />

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports && reports.length > 0 ? (
                      reports.slice(0, 3).map((report) => (
                        <div
                          key={report.id}
                          className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/doctor/reports/${report.id}`)}
                        >
                          <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center mr-3">
                            <FileText className="h-5 w-5 text-brand-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Report {report.status === "published" ? "Published" : "Created"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(
                                new Date(
                                  report.status === "published"
                                    ? report.published_at || report.updated_at
                                    : report.created_at
                                ),
                                "PPP"
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scanRecords && scanRecords.length > 0 ? (
                      scanRecords.slice(0, 3).map((scan) => (
                        <div
                          key={scan.id}
                          className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/doctor/scans/${scan.id}`)}
                        >
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <Upload className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{scan.scan_type}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(scan.date_taken || scan.created_at), "PPP")}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No scans available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start p-3 border rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Follow-up Consultation</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date().setDate(new Date().getDate() + 14), "PPP")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scans">
            <PatientScansList
              patientId={patientId || ""}
              scans={scanRecords || []}
              isLoading={isLoadingScans}
            />
          </TabsContent>

          <TabsContent value="reports">
            <PatientReportsList
              patientId={patientId || ""}
              reports={reports || []}
              isLoading={isLoadingReports}
              onViewReport={(reportId) => navigate(`/doctor/reports/${reportId}`)}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>
                  Patient's medical history and previous conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Conditions</h3>
                    <p>{patient.medical_history || "No medical history recorded"}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-lg mb-2">Allergies</h3>
                    <p>No known allergies</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-lg mb-2">Medications</h3>
                    <p>No current medications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </NewSidebar>
  );
};

export default PatientDetail;
