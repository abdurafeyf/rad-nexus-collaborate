import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FileText, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import NewSidebar from "@/components/NewSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

type Patient = {
  id: string;
  name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  address: string;
  created_at: string;
};

type ScanRecord = {
  id: string;
  patient_id: string;
  scan_type: string;
  date_taken: string;
  file_url: string;
  created_at: string;
  patient_name?: string;
};

type Report = {
  id: string;
  scan_record_id: string;
  patient_id: string;
  content: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
  patient_name?: string;
  scan_type?: string;
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("patients");

  // Fetch patients
  const {
    data: patients = [],
    isLoading: isLoadingPatients,
    error: patientsError,
  } = useQuery({
    queryKey: ["doctorPatients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("doctor_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as Patient[];
    },
    enabled: !!user?.id,
  });

  // Fetch scan records
  const {
    data: scanRecords = [],
    isLoading: isLoadingScans,
    error: scansError,
  } = useQuery({
    queryKey: ["doctorScans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scan_records")
        .select(`
          *,
          patients (
            name
          )
        `)
        .eq("doctor_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data.map((record) => ({
        ...record,
        patient_name: record.patients?.name,
      })) as ScanRecord[];
    },
    enabled: !!user?.id,
  });

  // Fetch reports
  const {
    data: reports = [],
    isLoading: isLoadingReports,
    error: reportsError,
  } = useQuery({
    queryKey: ["doctorReports", user?.id],
    queryFn: async () => {
      // First get all scan records by this doctor
      const { data: doctorScans, error: scansError } = await supabase
        .from("scan_records")
        .select("id")
        .eq("doctor_id", user?.id);

      if (scansError) {
        throw new Error(scansError.message);
      }

      if (!doctorScans.length) {
        return [];
      }

      const scanIds = doctorScans.map((scan) => scan.id);

      // Then get all reports for these scan records
      const { data: reportData, error: reportsError } = await supabase
        .from("reports")
        .select(`
          *,
          scan_records (
            scan_type,
            patient_id
          ),
          patients:scan_records(
            patients (
              name
            )
          )
        `)
        .in("scan_record_id", scanIds)
        .order("created_at", { ascending: false });

      if (reportsError) {
        throw new Error(reportsError.message);
      }

      return reportData.map((report) => ({
        ...report,
        scan_type: report.scan_records?.scan_type,
        patient_name: report.patients?.patients?.name,
      })) as Report[];
    },
    enabled: !!user?.id,
  });

  // Filter data based on search term
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredScans = scanRecords.filter(
    (scan) =>
      scan.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.scan_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter(
    (report) =>
      report.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.scan_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle errors
  useEffect(() => {
    if (patientsError) {
      toast({
        title: "Error loading patients",
        description: (patientsError as Error).message,
        variant: "destructive",
      });
    }

    if (scansError) {
      toast({
        title: "Error loading scan records",
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
  }, [patientsError, scansError, reportsError]);

  // Navigate to patient details
  const handlePatientClick = (patientId: string) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  // Navigate to report review
  const handleReportClick = (reportId: string) => {
    navigate(`/doctor/reports/${reportId}`);
  };

  return (
    <NewSidebar type="doctor">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Doctor Dashboard</h1>
            <p className="text-gray-500">
              Manage your patients, scans, and reports
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate("/doctor/add-patient")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Patient
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search patients, scans, or reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
        </div>

        <Tabs
          defaultValue="patients"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Patients
            </TabsTrigger>
            <TabsTrigger value="scans" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scans
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Patients Tab */}
          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle>Your Patients</CardTitle>
                <CardDescription>
                  View and manage your patient records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPatients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredPatients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Date of Birth</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                        <TableRow
                          key={patient.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handlePatientClick(patient.id)}
                        >
                          <TableCell className="font-medium">
                            {patient.name}
                          </TableCell>
                          <TableCell>{patient.email}</TableCell>
                          <TableCell>
                            {patient.gender
                              ? patient.gender.charAt(0).toUpperCase() +
                                patient.gender.slice(1)
                              : "Not specified"}
                          </TableCell>
                          <TableCell>
                            {patient.date_of_birth
                              ? format(
                                  new Date(patient.date_of_birth),
                                  "MMM d, yyyy"
                                )
                              : "Not specified"}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(patient.created_at),
                              "MMM d, yyyy"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-gray-500">No patients found</p>
                    {searchTerm && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scans Tab */}
          <TabsContent value="scans">
            <Card>
              <CardHeader>
                <CardTitle>Scan Records</CardTitle>
                <CardDescription>
                  View all scan records for your patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingScans ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredScans.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Scan Type</TableHead>
                        <TableHead>Date Taken</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredScans.map((scan) => (
                        <TableRow
                          key={scan.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            navigate(`/doctor/patients/${scan.patient_id}`)
                          }
                        >
                          <TableCell className="font-medium">
                            {scan.patient_name || "Unknown Patient"}
                          </TableCell>
                          <TableCell>{scan.scan_type}</TableCell>
                          <TableCell>
                            {format(new Date(scan.date_taken), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(scan.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-gray-500">No scan records found</p>
                    {searchTerm && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                  View and manage all patient reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredReports.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Scan Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow
                          key={report.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleReportClick(report.id)}
                        >
                          <TableCell className="font-medium">
                            {report.patient_name || "Unknown Patient"}
                          </TableCell>
                          <TableCell>{report.scan_type || "Unknown"}</TableCell>
                          <TableCell>
                            {report.status === "published" ? (
                              <Badge variant="success">Published</Badge>
                            ) : (
                              <Badge variant="outline">Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(report.created_at),
                              "MMM d, yyyy"
                            )}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(report.updated_at),
                              "MMM d, yyyy"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-gray-500">No reports found</p>
                    {searchTerm && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </NewSidebar>
  );
};

export default DoctorDashboard;
