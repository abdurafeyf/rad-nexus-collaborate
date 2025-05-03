
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
  
  useEffect(() => {
    if (user) {
      const type = user.user_metadata?.user_type || "doctor";
      setUserType(type);
    }
  }, [user]);
  
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        if (!user) return;
        
        setIsLoading(true);
        
        let query;
        
        if (userType === "doctor") {
          // For doctors, fetch all patients they have chatted with
          const { data: patients, error: patientsError } = await supabase
            .from("chats")
            .select("patient_id")
            .eq("sender_type", "doctor")
            .order("created_at", { ascending: false })
            .limit(100);
            
          if (patientsError) throw patientsError;
          
          // Get unique patient IDs
          const uniquePatientIds = [...new Set(patients?.map(p => p.patient_id) || [])];
          
          if (uniquePatientIds.length > 0) {
            // Fetch patient details
            const { data: patientDetails, error: detailsError } = await supabase
              .from("patients")
              .select("*")
              .in("id", uniquePatientIds);
              
            if (detailsError) throw detailsError;
            
            // Get the most recent message for each patient
            const conversationsWithLastMessage = await Promise.all(
              (patientDetails || []).map(async (patient) => {
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
          // Placeholder for now
          setConversations([]);
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
  }, [user, userType, toast]);
  
  const filteredConversations = conversations.filter(
    conversation => conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleConversationClick = (patientId: string) => {
    if (userType === "doctor") {
      navigate(`/doctor/patients/${patientId}/chat`);
    } else {
      // For patient view - adjust as needed
      // navigate(`/patient/chat/${doctorId}`);
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
