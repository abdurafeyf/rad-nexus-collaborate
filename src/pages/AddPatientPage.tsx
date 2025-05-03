
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import NewSidebar from "@/components/NewSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { patientFormSchema, PatientFormValues } from "@/types/patient";
import { createPatient } from "@/services/patientService";
import PersonalInfoSection from "@/components/patient/PersonalInfoSection";
import MedicalNotesSection from "@/components/patient/MedicalNotesSection";
import ScanRecordsSection from "@/components/patient/ScanRecordsSection";

const AddPatientPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", user.id)
          .single();
          
        if (error) throw error;
        
        setCurrentDoctorId(data.id);
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
  }, [user, toast]);
  
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      notes: "",
      xrays: [],
    },
  });

  const onSubmit = async (data: PatientFormValues) => {
    if (!currentDoctorId) {
      toast({
        title: "Error",
        description: "Doctor information is not available. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await createPatient({
        ...data,
        doctorId: currentDoctorId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: result.isNewPatient ? "Patient added successfully" : "Patient information updated",
        description: result.isNewPatient 
          ? "The patient has been added and will receive login details."
          : "The patient has been updated with new information.",
      });

      // Reset the form
      form.reset();
      
      // Navigate back to dashboard
      navigate("/doctor/dashboard");
    } catch (error: any) {
      toast({
        title: "Error adding patient",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <NewSidebar type="doctor">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add New Patient</h1>
                <p className="text-sm text-gray-600">
                  Enter patient details below to add them to your dashboard
                </p>
              </div>
              <Button
                onClick={() => navigate("/doctor/dashboard")}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <PersonalInfoSection form={form} />
                <MedicalNotesSection form={form} />
                <ScanRecordsSection form={form} />

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/doctor/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !currentDoctorId}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    {isSubmitting ? "Adding Patient..." : "Add Patient & Send Login Details"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </NewSidebar>
  );
};

export default AddPatientPage;
