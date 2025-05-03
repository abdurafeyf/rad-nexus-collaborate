
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userType, setUserType] = useState<"doctor" | "patient">("doctor");
  const [currentDoctor, setCurrentDoctor] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      const type = user.user_metadata?.user_type || "doctor";
      setUserType(type);
    }
  }, [user]);

  // Fetch doctor info if user is a doctor
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!user || userType !== "doctor") return;
      
      try {
        const { data, error } = await supabase
          .from("doctors")
          .select("*")
          .eq("user_id", user.id)
          .single();
          
        if (error) throw error;
        
        setCurrentDoctor(data);
      } catch (error: any) {
        console.error("Error fetching doctor info:", error);
      }
    };
    
    fetchDoctorInfo();
  }, [user, userType]);
  
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        if (!user) return;
        
        setIsLoading(true);
        
        if (userType === "doctor" && currentDoctor) {
          // For doctors, fetch patients they have chatted with
          // First get all patients assigned to this doctor
          const { data: patients, error: patientsError } = await supabase
            .from("patients")
            .select("*")
            .eq("doctor_id", currentDoctor.id)
            .order("last_visit", { ascending: false });
            
          if (patientsError) throw patientsError;
          
          if (patients && patients.length > 0) {
            // For each patient, get their most recent message
            const conversationsWithLastMessage = await Promise.all(
              patients.map(async (patient) => {
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
          }
        } else if (userType === "patient") {
          // For patients, show doctors they can message
          // This would need to be implemented based on your data model
          // Placeholder for now - fetch the assigned doctor
          const { data: patientData, error: patientError } = await supabase
            .from("patients")
            .select("doctor_id")
            .eq("id", user.user_metadata?.patient_id)
            .single();
            
          if (patientError && !patientError.message.includes("No rows found")) throw patientError;
          
          if (patientData?.doctor_id) {
            const { data: doctorData, error: doctorError } = await supabase
              .from("doctors")
              .select("*")
              .eq("id", patientData.doctor_id)
              .single();
              
            if (doctorError) throw doctorError;
            
            const { data: lastMessage } = await supabase
              .from("chats")
              .select("*")
              .eq("patient_id", user.user_metadata?.patient_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            setConversations([
              {
                id: doctorData.id,
                name: `Dr. ${doctorData.first_name} ${doctorData.last_name}`,
                email: doctorData.email,
                lastMessage: lastMessage?.message || "No messages",
                lastMessageTime: lastMessage?.created_at || new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();

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
    } else if (user && userType === "patient") {
      channel = supabase
        .channel('patient-chats')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chats',
            filter: `patient_id=eq.${user.user_metadata?.patient_id}` 
          },
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
  }, [user, userType, currentDoctor, toast]);
  
  const filteredConversations = conversations.filter(
    conversation => conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleConversationClick = (conversationId: string) => {
    if (userType === "doctor") {
      navigate(`/doctor/patients/${conversationId}/chat`);
    } else {
      navigate(`/patient/chat`);
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
