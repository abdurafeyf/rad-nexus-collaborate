
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NewSidebar from "@/components/NewSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import DoctorConversationsList from "@/components/patient/DoctorConversationsList";

const PatientConversationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPatientInfo = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // First try to get patient by email
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();
          
        if (patientError && !patientError.message.includes("No rows found")) {
          throw patientError;
        }
        
        if (patientData) {
          setPatientId(patientData.id);
        } else if (user.user_metadata?.patient_id) {
          // If no match by email, try using patient_id from user metadata
          setPatientId(user.user_metadata.patient_id);
        } else {
          toast({
            title: "Profile not found",
            description: "Could not find your patient profile",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error fetching patient info:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientInfo();
  }, [user, toast]);
  
  if (isLoading) {
    return (
      <NewSidebar type="patient">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-teal-500"></div>
          </div>
        </div>
      </NewSidebar>
    );
  }
  
  if (!patientId) {
    return (
      <NewSidebar type="patient">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Profile Not Found</h2>
            <p className="mt-2 text-gray-500">Could not find your patient profile.</p>
          </div>
        </div>
      </NewSidebar>
    );
  }
  
  return (
    <NewSidebar type="patient">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Your Conversations</h1>
          <p className="text-gray-600">Chat with your healthcare providers</p>
        </div>
        
        <DoctorConversationsList patientId={patientId} />
      </div>
    </NewSidebar>
  );
};

export default PatientConversationsPage;
