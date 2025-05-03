
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import NewNavBar from "@/components/NewNavBar";
import Footer from "@/components/Footer";
import NewSidebar from "@/components/NewSidebar";
import AddPatientDrawer from "@/components/doctor/AddPatientDrawer";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

// Define the patient type based on the database schema
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
  doctor_id: string;
};

type Doctor = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

const DoctorDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Patient;
    direction: "asc" | "desc";
  }>({ key: "last_visit", direction: "desc" });
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);

  // First fetch the current doctor's info
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("doctors")
          .select("*")
          .eq("user_id", user.id)
          .single();
          
        if (error) throw error;
        
        setCurrentDoctor(data as Doctor);
      } catch (error: any) {
        console.error("Error fetching doctor info:", error);
        toast({
          title: "Error",
          description: "Could not fetch doctor information.",
          variant: "destructive",
        });
      }
    };
    
    fetchDoctorInfo();
  }, [user]);

  // Fetch patients data once we have the doctor's ID
  useEffect(() => {
    if (!currentDoctor) return;
    
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("doctor_id", currentDoctor.id);

        if (error) {
          throw error;
        }

        setPatients(data as Patient[]);
      } catch (error: any) {
        toast({
          title: "Error fetching patients",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [currentDoctor]);

  // Handle patient deletion
  const handleDeletePatient = async (id: string) => {
    try {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setPatients((prev) => prev.filter((patient) => patient.id !== id));
      
      toast({
        title: "Patient deleted",
        description: "Patient has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting patient",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle patient status toggle
  const handleToggleStatus = async (id: string, currentStatus: "active" | "passive") => {
    const newStatus = currentStatus === "active" ? "passive" : "active";
    try {
      const { error } = await supabase
        .from("patients")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === id ? { ...patient, status: newStatus } : patient
        )
      );
      
      toast({
        title: "Status updated",
        description: `Patient status changed to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle sort
  const handleSort = (key: keyof Patient) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  // Apply sorting and filtering
  const sortedAndFilteredPatients = [...patients]
    .filter((patient) => {
      if (!searchQuery) return true;
      return (
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortConfig.key === "last_visit") {
        return sortConfig.direction === "asc"
          ? new Date(a.last_visit).getTime() - new Date(b.last_visit).getTime()
          : new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
      }
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  // Manual refresh function
  const fetchPatients = async () => {
    if (!currentDoctor) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("doctor_id", currentDoctor.id);

      if (error) {
        throw error;
      }

      setPatients(data as Patient[]);
    } catch (error: any) {
      toast({
        title: "Error fetching patients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NewSidebar type="doctor">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="p-6 md:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Doctor Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your patients and their records
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => fetchPatients()}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={() => setIsDrawerOpen(true)}
                size="sm"
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600"
              >
                <Plus className="h-4 w-4" />
                Add Patient
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-0 shadow-subtle">
            <CardHeader className="bg-white pb-0">
              <CardTitle>Patients</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="flex items-center p-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-8 border border-gray-200 focus:border-teal-500 focus:ring focus:ring-teal-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortConfig.key === "name" && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center gap-1">
                          Email
                          {sortConfig.key === "email" && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("last_visit")}
                      >
                        <div className="flex items-center gap-1">
                          Last Visit
                          {sortConfig.key === "last_visit" && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortConfig.key === "status" && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center"
                        >
                          <div className="flex justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : sortedAndFilteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center"
                        >
                          No patients found. Add your first patient to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedAndFilteredPatients.map((patient) => (
                        <TableRow key={patient.id} className="hover-card">
                          <TableCell className="font-medium">
                            <div 
                              className="cursor-pointer hover:text-teal-600 transition-colors"
                              onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                            >
                              {patient.name}
                            </div>
                          </TableCell>
                          <TableCell>{patient.email}</TableCell>
                          <TableCell>
                            {format(new Date(patient.last_visit), "PPP")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={patient.status === "active" ? "default" : "outline"}
                              className={patient.status === "active" ? "bg-teal-500 hover:bg-teal-600" : ""}
                            >
                              {patient.status === "active" ? "Active" : "Closed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                                  className="cursor-pointer"
                                >
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => navigate(`/doctor/patients/${patient.id}/chat`)}
                                  className="cursor-pointer"
                                >
                                  Chat
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => navigate(`/doctor/patients/${patient.id}/scan/upload`)}
                                  className="cursor-pointer"
                                >
                                  Upload Scan
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(patient.id, patient.status)}
                                  className="cursor-pointer"
                                >
                                  {patient.status === "active" ? "Close case" : "Reopen case"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 cursor-pointer"
                                  onClick={() => handleDeletePatient(patient.id)}
                                >
                                  Delete patient
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AddPatientDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        onPatientAdded={() => {
          fetchPatients();
          setIsDrawerOpen(false);
        }}
        doctorId={currentDoctor?.id}
      />
    </NewSidebar>
  );
};

export default DoctorDashboard;
