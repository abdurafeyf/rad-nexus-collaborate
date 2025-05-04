import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowUpDown,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  ToggleRight,
  ToggleLeft,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NewSidebar from "@/components/NewSidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "passive">("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Patient;
    direction: "asc" | "desc";
  }>({ key: "last_visit", direction: "desc" });
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [deleteWithHistory, setDeleteWithHistory] = useState(false);

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
      // Check if patient has any scan records
      const { data: scanRecords, error: scanError } = await supabase
        .from("scan_records")
        .select("id")
        .eq("patient_id", id);

      if (scanError) throw scanError;

      const hasScanRecords = (scanRecords?.length || 0) > 0;

      if (hasScanRecords) {
        // Show confirmation dialog
        setPatientToDelete(id);
        setShowDeleteDialog(true);
        return;
      }

      // If no scan records, proceed with simple deletion
      await deletePatientRecord(id);
    } catch (error: any) {
      toast({
        title: "Error checking patient records",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePatientRecord = async (id: string, deleteHistory: boolean = false) => {
    try {
      if (deleteHistory) {
        // Step 1: Delete reports first (they reference scan_records)
        const { error: reportError } = await supabase
          .from("reports")
          .delete()
          .eq("patient_id", id);

        if (reportError) throw reportError;
        
        // Step 2: Delete scan records
        const { error: scanError } = await supabase
          .from("scan_records")
          .delete()
          .eq("patient_id", id);

        if (scanError) throw scanError;
      } else {
        // If we're not deleting history, we need to handle potential foreign key constraints
        // First, get all scan record IDs for this patient
        const { data: scanRecords, error: scanQueryError } = await supabase
          .from("scan_records")
          .select("id")
          .eq("patient_id", id);
          
        if (scanQueryError) throw scanQueryError;
        
        // If there are scan records with reports, set the reports' scan_record_id to null
        if (scanRecords && scanRecords.length > 0) {
          const scanIds = scanRecords.map(sr => sr.id);
          
          // Update reports to remove references to scan records
          const { error: reportsUpdateError } = await supabase
            .from("reports")
            .update({ scan_record_id: null })
            .in("scan_record_id", scanIds);
            
          if (reportsUpdateError) throw reportsUpdateError;
        }
      }

      // Finally delete the patient record
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPatients((prev) => prev.filter((patient) => patient.id !== id));
      
      toast({
        title: "Patient deleted",
        description: deleteHistory 
          ? "Patient and all associated records have been deleted."
          : "Patient has been deleted. Scan records have been preserved.",
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

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Apply sorting and filtering
  const sortedAndFilteredPatients = [...patients]
    .filter((patient) => {
      // Status filter
      if (statusFilter !== "all" && patient.status !== statusFilter) {
        return false;
      }
      
      // Search filter
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

  // Helper function to get patient initials for avatar
  const getPatientInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <NewSidebar type="doctor">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="p-4 md:p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Doctor Dashboard</h1>
              <p className="text-sm text-gray-600">
                Manage your patients and their records
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchPatients()}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={() => navigate("/doctor/add-patient")}
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Patient
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border border-gray-100 shadow-sm">
            <div className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-grow">
                <div className="relative flex w-full md:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-8 pr-8 border border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9 text-gray-500 hover:text-gray-800"
                      onClick={handleClearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Select 
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as any)}
                >
                  <SelectTrigger className="w-[130px] border border-gray-200">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="passive">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="w-[240px]">
                        <div className="flex items-center gap-1">
                          Patient
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Email
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("last_visit")}
                      >
                        <div className="flex items-center gap-1">
                          Last Visit
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Status
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
                        <TableRow 
                          key={patient.id} 
                          className="group transition-colors hover:bg-teal-50/30 hover:shadow-sm"
                          onMouseEnter={() => setHoveredRow(patient.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <TableCell>
                            <div 
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                            >
                              <Avatar className="h-8 w-8 bg-teal-100">
                                <AvatarFallback className="text-xs font-medium text-teal-700">
                                  {getPatientInitials(patient.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-gray-900 hover:text-teal-600 transition-colors">
                                {patient.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{patient.email}</TableCell>
                          <TableCell className="text-gray-600">
                            {format(new Date(patient.last_visit), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={patient.status === "active" ? "default" : "outline"}
                              className={patient.status === "active" ? "bg-teal-500 hover:bg-teal-600" : "text-gray-600"}
                            >
                              {patient.status === "active" ? "Active" : "Closed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`flex justify-end gap-1 ${hoveredRow === patient.id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'} transition-opacity`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                                title="Edit patient"
                              >
                                <Edit className="h-4 w-4 text-gray-500" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleStatus(patient.id, patient.status)}
                                title={patient.status === "active" ? "Close case" : "Reopen case"}
                              >
                                {patient.status === "active" ? (
                                  <ToggleRight className="h-4 w-4 text-teal-500" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600 cursor-pointer"
                                    onClick={() => handleDeletePatient(patient.id)}
                                  >
                                    Confirm Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Patient</DialogTitle>
              <DialogDescription>
                This patient has scan records associated with their account. Would you like to:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="keepHistory"
                  name="deleteOption"
                  checked={!deleteWithHistory}
                  onChange={() => setDeleteWithHistory(false)}
                  className="h-4 w-4 text-teal-600"
                />
                <label htmlFor="keepHistory" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Delete patient only (keep scan records)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="deleteHistory"
                  name="deleteOption"
                  checked={deleteWithHistory}
                  onChange={() => setDeleteWithHistory(true)}
                  className="h-4 w-4 text-teal-600"
                />
                <label htmlFor="deleteHistory" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Delete patient and all scan records
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setPatientToDelete(null);
                  setDeleteWithHistory(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (patientToDelete) {
                    deletePatientRecord(patientToDelete, deleteWithHistory);
                  }
                  setShowDeleteDialog(false);
                  setPatientToDelete(null);
                  setDeleteWithHistory(false);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </NewSidebar>
  );
};

export default DoctorDashboard;
