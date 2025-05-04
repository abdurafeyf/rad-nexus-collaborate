
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, Lock, Save, X, AlertCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScanRecordsList } from "./ScanRecordsList";

interface PatientData {
  id: string;
  name: string;
  email: string;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

interface PatientProfilePanelProps {
  isDoctor?: boolean;
}

const PatientProfilePanel: React.FC<PatientProfilePanelProps> = ({ isDoctor = false }) => {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<PatientData>>({});
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!user) return;

      try {
        let query;
        
        if (isDoctor) {
          // If doctor, they need to specify which patient to view
          const patientId = new URLSearchParams(window.location.search).get('patientId');
          if (!patientId) {
            throw new Error("Patient ID is required for doctor view");
          }
          query = supabase.from("patients").select("*").eq("id", patientId).single();
        } else {
          // For patients viewing their own profile
          query = supabase.from("patients").select("*").eq("email", user.email).single();
        }
        
        const { data, error } = await query;

        if (error) throw error;
        setPatient(data);
        
        // If we have an updated_by field, fetch the user who last updated the record
        if (data.updated_by) {
          const { data: updaterData } = await supabase
            .from("doctors")
            .select("first_name, last_name")
            .eq("user_id", data.updated_by)
            .single();
          
          if (updaterData) {
            setLastUpdatedBy(`Dr. ${updaterData.first_name} ${updaterData.last_name}`);
          }
        }
      } catch (error: any) {
        console.error("Error fetching patient profile:", error);
        toast({
          title: "Error",
          description: "Could not fetch profile information.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [user, toast, isDoctor]);

  // Initialize edit data when patient data changes
  useEffect(() => {
    if (patient) {
      setEditedData({
        name: patient.name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        phone_number: patient.phone_number || "",
        emergency_contact_name: patient.emergency_contact_name || "",
        emergency_contact_phone: patient.emergency_contact_phone || "",
        notes: patient.notes || "",
      });
    }
  }, [patient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setEditedData((prev) => ({
      ...prev,
      date_of_birth: date ? date.toISOString().split("T")[0] : null,
    }));
  };

  const handleCancel = () => {
    // Reset form to original data
    if (patient) {
      setEditedData({
        name: patient.name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        phone_number: patient.phone_number || "",
        emergency_contact_name: patient.emergency_contact_name || "",
        emergency_contact_phone: patient.emergency_contact_phone || "",
        notes: patient.notes || "",
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!patient || !user) return;

    try {
      // Validate form data
      if (isDoctor && editedData.name && editedData.name.trim() === "") {
        toast({
          title: "Validation Error",
          description: "Name is required",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("patients")
        .update({
          ...editedData,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq("id", patient.id)
        .select();

      if (error) throw error;

      // Update local state
      setPatient({
        ...patient,
        ...editedData,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      });
      
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Profile information updated successfully",
      });
      
      // Update last updater information
      const { data: userData } = await supabase
        .from("doctors")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .single();
        
      if (userData) {
        setLastUpdatedBy(`Dr. ${userData.first_name} ${userData.last_name}`);
      }
    } catch (error: any) {
      console.error("Error updating patient profile:", error);
      toast({
        title: "Error",
        description: "Could not update profile information.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-subtle">
        <CardHeader className="border-b">
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="flex justify-between py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card className="border-0 shadow-subtle">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Profile information not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="personal">
        <TabsList className="mb-6">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="medical">Medical Notes</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
          {isDoctor && <TabsTrigger value="scans">Scan Records</TabsTrigger>}
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card className="border-0 shadow-subtle">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Personal Information</CardTitle>
              {(isDoctor || false) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {isEditing && isDoctor ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={editedData.name || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={patient.email}
                        disabled
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !editedData.date_of_birth && "text-gray-400"
                            )}
                          >
                            {editedData.date_of_birth ? (
                              format(new Date(editedData.date_of_birth), "PPP")
                            ) : (
                              "Select date of birth"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editedData.date_of_birth ? new Date(editedData.date_of_birth) : undefined}
                            onSelect={handleDateChange}
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            disabled={(date) => date > new Date()}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={editedData.gender || ""} 
                        onValueChange={(value) => handleSelectChange("gender", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input 
                        id="phone_number" 
                        name="phone_number"
                        value={editedData.phone_number || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. +1 (555) 123-4567"
                      />
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <Button
                        onClick={handleSave}
                        className="bg-teal-500 hover:bg-teal-600"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">Name</span>
                      <span className="font-medium">{patient.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">Email</span>
                      <span className="font-medium">{patient.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">Date of Birth</span>
                      <span className="font-medium">
                        {patient.date_of_birth 
                          ? format(new Date(patient.date_of_birth), "MMMM d, yyyy")
                          : "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">Gender</span>
                      <span className="font-medium">
                        {patient.gender 
                          ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) 
                          : "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">Phone Number</span>
                      <span className="font-medium">
                        {patient.phone_number || "Not provided"}
                      </span>
                    </div>
                  </>
                )}
                
                {/* Audit trail information */}
                {patient.updated_at && (
                  <Alert className="bg-gray-50 mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Last updated {format(new Date(patient.updated_at), "PPP")}
                      {lastUpdatedBy ? ` by ${lastUpdatedBy}` : ""}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Notes Tab */}
        <TabsContent value="medical">
          <Card className="border-0 shadow-subtle">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Medical Notes</CardTitle>
              {(isDoctor || false) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {isEditing && isDoctor ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Medical Notes</Label>
                    <Textarea 
                      id="notes" 
                      name="notes"
                      value={editedData.notes || ""}
                      onChange={handleInputChange}
                      placeholder="Enter medical notes here..."
                      className="min-h-[200px]"
                    />
                    <p className="text-xs text-gray-500">
                      Line breaks are preserved. Markdown is not supported.
                    </p>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleSave}
                      className="bg-teal-500 hover:bg-teal-600"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Notes
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-2">
                  {patient.notes ? (
                    <div className="whitespace-pre-line">{patient.notes}</div>
                  ) : (
                    <p className="text-gray-500 italic">No medical notes available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contact Tab */}
        <TabsContent value="emergency">
          <Card className="border-0 shadow-subtle">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
              {(isDoctor || false) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {isEditing && isDoctor ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_name">Contact Name</Label>
                      <Input 
                        id="emergency_contact_name" 
                        name="emergency_contact_name"
                        value={editedData.emergency_contact_name || ""}
                        onChange={handleInputChange}
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                      <Input 
                        id="emergency_contact_phone" 
                        name="emergency_contact_phone"
                        value={editedData.emergency_contact_phone || ""}
                        onChange={handleInputChange}
                        placeholder="Emergency contact phone number"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleSave}
                      className="bg-teal-500 hover:bg-teal-600"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Contact
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {patient.emergency_contact_name || patient.emergency_contact_phone ? (
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-500">Contact Name</span>
                        <span className="font-medium">
                          {patient.emergency_contact_name || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-500">Contact Phone</span>
                        <span className="font-medium">
                          {patient.emergency_contact_phone || "Not provided"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Phone className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500">No emergency contact information provided</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scan Records Tab (Doctor Only) */}
        {isDoctor && (
          <TabsContent value="scans">
            <ScanRecordsList patientId={patient.id} isDoctor={isDoctor} />
          </TabsContent>
        )}
      </Tabs>

      {/* Security Card */}
      <Card className="border-0 shadow-subtle">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Security</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium mb-1">Password</h3>
              <p className="text-sm text-gray-500">Update your password</p>
            </div>
            <Button variant="outline" size="sm">
              <Lock className="h-4 w-4 mr-2" />
              Change
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientProfilePanel;
