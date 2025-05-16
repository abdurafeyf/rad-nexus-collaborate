
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NewSidebar from "@/components/NewSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, MessageSquare, ChevronRight, User } from "lucide-react";

const MessagesPage = () => {
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDoctor, setCurrentDoctor] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  
  // Fetch patient info if user is a patient
  useEffect(() => {
    const fetchPatientInfo = async () => {
      if (!user || userType !== "patient") return;
      
      try {
        console.log("Fetching patient info for email:", user.email);
        
        // First, try to get the patient by email
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();
          
        if (patientError && !patientError.message.includes("No rows found")) {
          throw patientError;
        }
        
        if (patientData) {
          console.log("Patient found by email:", patientData);
          setPatientInfo(patientData);
        } else if (user.user_metadata?.patient_id) {
          // If no match by email, try using patient_id from user metadata
          const { data: patientById, error: patientByIdError } = await supabase
            .from("patients")
            .select("*")
            .eq("id", user.user_metadata.patient_id)
            .maybeSingle();
            
          if (patientByIdError && !patientByIdError.message.includes("No rows found")) {
            throw patientByIdError;
          }
          
          if (patientById) {
            console.log("Patient found by ID:", patientById);
            setPatientInfo(patientById);
          } else {
            console.log("No patient record found for this user");
            toast({
              title: "Profile not found",
              description: "Could not find your patient profile",
              variant: "destructive",
            });
          }
        } else {
          console.log("No patient_id in user metadata and no matching email");
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
      }
    };
    
    fetchPatientInfo();
  }, [user, userType, toast]);

  // Fetch doctor info if user is a doctor
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!user || userType !== "doctor") return;
      
      try {
        console.log("Fetching doctor info for user ID:", user.id);
        
        const { data, error } = await supabase
          .from("doctors")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (error && !error.message.includes("No rows found")) throw error;
        
        if (data) {
          console.log("Doctor found:", data);
          setCurrentDoctor(data);
        } else {
          console.log("No doctor record found for this user");
          toast({
            title: "Profile not found",
            description: "Could not find your doctor profile",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error fetching doctor info:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile",
          variant: "destructive",
        });
      }
    };
    
    fetchDoctorInfo();
  }, [user, userType, toast]);
  
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        if (!user) return;
        
        setIsLoading(true);
        console.log("Fetching conversations for user type:", userType);
        
        if (userType === "doctor" && currentDoctor) {
          console.log("Fetching patients for doctor ID:", currentDoctor.id);
          // For doctors, fetch patients they have chatted with
          const { data: patients, error: patientsError } = await supabase
            .from("patients")
            .select("*")
            .eq("doctor_id", currentDoctor.id)
            .order("last_visit", { ascending: false });
            
          if (patientsError) throw patientsError;
          
          console.log("Patients found:", patients?.length || 0);
          
          if (patients && patients.length > 0) {
            // For each patient, get their most recent message
            const conversationsWithLastMessage = await Promise.all(
              patients.map(async (patient) => {
                console.log("Getting last message for patient:", patient.id);
                const { data: lastMessage } = await supabase
                  .from("chats")
                  .select("*")
                  .eq("patient_id", patient.id)
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                  
                return {
                  ...patient,
                  lastMessage: lastMessage?.message || "No messages",
                  lastMessageTime: lastMessage?.created_at || patient.last_visit,
                };
              })
            );
            
            setConversations(conversationsWithLastMessage);
            console.log("Conversations set for doctor:", conversationsWithLastMessage.length);
          } else {
            console.log("No patients found for this doctor");
            setConversations([]);
          }
        } else if (userType === "patient" && patientInfo) {
          console.log("Patient detected, redirecting to conversations page");
          // For patients, we now redirect to the conversations page
          navigate("/patient/conversations");
          return;
        } else {
          console.log("No patient info or doctor info found");
          setConversations([]);
        }
      } catch (error: any) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if ((userType === "doctor" && currentDoctor) || 
        (userType === "patient" && patientInfo)) {
      fetchConversations();
    } else if (user && !isLoading && !currentDoctor && !patientInfo) {
      // If we have a user but no doctor/patient info after loading
      setIsLoading(false);
      console.log("User found but no matching profile");
    }

    // Set up real-time subscription for new messages
    let channel: any;
    
    if (user && userType === "doctor" && currentDoctor) {
      channel = supabase
        .channel('doctor-chats')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chats' },
          (payload) => {
            // When a new message comes in, refresh conversations
            fetchConversations();
          }
        )
        .subscribe();
    }
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, userType, currentDoctor, patientInfo, toast, navigate]);
  
  const filteredConversations = conversations.filter(
    conversation => conversation.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleConversationClick = (conversationId: string) => {
    if (userType === "doctor") {
      navigate(`/doctor/patients/${conversationId}/chat`);
    }
  };
  
  return (
    <NewSidebar type={userType as "doctor" | "patient"}>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Conversations</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 animate-pulse rounded-md bg-gray-100"></div>
                ))}
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex cursor-pointer items-center justify-between rounded-md border p-4 transition-colors hover:bg-gray-50"
                    onClick={() => handleConversationClick(conversation.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{conversation.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-xs text-gray-400">
                        {new Date(conversation.lastMessageTime).toLocaleDateString()}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-gray-500">No conversations found</p>
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
      </div>
    </NewSidebar>
  );
};

export default MessagesPage;
