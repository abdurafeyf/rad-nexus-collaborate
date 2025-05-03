
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  Upload,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Patient type definition
type Patient = {
  id: string;
  name: string;
  email: string;
  date_of_birth: string | null;
  gender: string | null;
  notes: string | null;
  status: "active" | "passive";
  last_visit: string;
  created_at: string;
};

// X-ray type definition
type XRay = {
  id: string;
  patient_id: string;
  date: string;
  file_path: string | null;
  created_at: string;
};

// Report type definition
type Report = {
  id: string;
  scan_id: string;
  patient_id: string;
  content: string;
  status: "draft" | "published";
  created_at: string;
  published_at: string | null;
};

const PatientDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [xrays, setXrays] = useState<XRay[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [updatedNotes, setUpdatedNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch patient data
  const fetchPatientData = async () => {
    if (!patientId) return;
    
    setIsLoading(true);
    
    try {
      // Fetch patient info
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (patientError) {
        throw patientError;
      }

      setPatient(patientData as Patient);
      setUpdatedNotes(patientData.notes || "");

      // Fetch x-rays
      const { data: xrayData, error: xrayError } = await supabase
        .from("x_rays")
        .select("*")
        .eq("patient_id", patientId)
        .order("date", { ascending: false });

      if (xrayError) {
        throw xrayError;
      }

      setXrays(xrayData as XRay[]);

      // Fetch reports
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (reportError) {
        throw reportError;
      }

      setReports(reportData as Report[]);
      
    } catch (error: any) {
      toast({
        title: "Error fetching patient data",
        description: error.message,
        variant: "destructive",
      });
      navigate("/doctor/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  // Update patient notes
  const handleUpdateNotes = async () => {
    if (!patient) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("patients")
        .update({ notes: updatedNotes })
        .eq("id", patient.id);

      if (error) {
        throw error;
      }

      setPatient({
        ...patient,
        notes: updatedNotes,
      });

      setIsNotesDialogOpen(false);
      
      toast({
        title: "Notes updated",
        description: "Patient notes have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating notes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <main className="flex-grow bg-gray-50">
          <div className="container py-8">
            <div className="flex justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <main className="flex-grow bg-gray-50">
          <div className="container py-8">
            <div className="flex flex-col items-center py-16">
              <h2 className="mb-4 text-2xl font-bold">Patient Not Found</h2>
              <Button
                onClick={() => navigate("/doctor/dashboard")}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-grow bg-gray-50">
        <div className="container py-8">
          {/* Back navigation */}
          <Button
            onClick={() => navigate("/doctor/dashboard")}
            variant="ghost"
            className="mb-6 -ml-3"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          {/* Patient header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
              <p className="text-muted-foreground">{patient.email}</p>
              
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={patient.status === "active" ? "default" : "outline"}>
                  {patient.status === "active" ? "Active Case" : "Closed Case"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate(`/doctor/patients/${patientId}/chat`)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </Button>
              <Button
                onClick={() => navigate(`/doctor/patients/${patientId}/scan/upload`)}
                variant="default"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Scan
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column: Patient info */}
            <div className="space-y-6">
              {/* Basic info card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Patient Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-2 h-4 w-4" />
                        Patient ID
                      </div>
                      <div className="font-medium">{patient.id}</div>
                    </div>
                    
                    {patient.gender && (
                      <div>
                        <div className="text-sm text-muted-foreground">Gender</div>
                        <div className="font-medium capitalize">{patient.gender}</div>
                      </div>
                    )}
                    
                    {patient.date_of_birth && (
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          Date of Birth
                        </div>
                        <div className="font-medium">
                          {format(new Date(patient.date_of_birth), "PPP")}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        Last Visit
                      </div>
                      <div className="font-medium">
                        {format(new Date(patient.last_visit), "PPP")}
                      </div>
                    </div>

                    <Separator />
                    
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Notes</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setIsNotesDialogOpen(true)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="rounded-md bg-muted/50 p-3 text-sm">
                        {patient.notes ? (
                          <p className="whitespace-pre-wrap">{patient.notes}</p>
                        ) : (
                          <p className="text-muted-foreground">No notes available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column: Reports and X-rays */}
            <div className="lg:col-span-2 space-y-6">
              {/* Reports */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Radiology Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No radiology reports available for this patient.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate(`/doctor/patients/${patientId}/scan/upload`)}
                      >
                        Upload Scan & Generate Report
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <div className="font-medium">
                              Report from {format(new Date(report.created_at), "PPP")}
                            </div>
                            <div className="flex items-center text-sm">
                              <Badge 
                                variant={report.status === "published" ? "default" : "outline"} 
                                className="mr-2"
                              >
                                {report.status === "published" ? "Published" : "Draft"}
                              </Badge>
                              {report.published_at && (
                                <span className="text-muted-foreground">
                                  Published on {format(new Date(report.published_at), "PPP")}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/doctor/reports/${report.id}/review`)}
                          >
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* X-rays */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">X-ray Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {xrays.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No X-ray records available for this patient.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate(`/doctor/patients/${patientId}/scan/upload`)}
                      >
                        Upload New X-ray
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {xrays.map((xray) => (
                        <div
                          key={xray.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <div className="font-medium">
                              X-ray from {format(new Date(xray.date), "PPP")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {xray.id}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Notes editing dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Notes</DialogTitle>
            <DialogDescription>
              Update the patient's notes below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              value={updatedNotes || ""}
              onChange={(e) => setUpdatedNotes(e.target.value)}
              className="min-h-[200px]"
              placeholder="Enter patient notes here..."
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNotesDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateNotes}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientDetail;
