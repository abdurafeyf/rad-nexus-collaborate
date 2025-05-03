
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, Lock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientData {
  id: string;
  name: string;
  email: string;
  date_of_birth: string | null;
  gender: string | null;
}

const PatientProfilePanel: React.FC = () => {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("email", user.email)
          .single();

        if (error) throw error;
        setPatient(data);
      } catch (error: any) {
        console.error("Error fetching patient profile:", error);
        toast({
          title: "Error",
          description: "Could not fetch your profile information.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [user, toast]);

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
      {/* Personal Information Card */}
      <Card className="border-0 shadow-subtle">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
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
          </div>
        </CardContent>
      </Card>

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

      {/* Privacy Card */}
      <Card className="border-0 shadow-subtle">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Privacy Preferences</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium mb-1">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive updates about your care</p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientProfilePanel;
