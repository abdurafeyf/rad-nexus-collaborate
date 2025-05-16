
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type DoctorConversation = {
  id: string;
  name: string;
  email?: string;
  lastMessage: string;
  lastMessageTime: string;
  doctorId: string;
};

interface DoctorConversationsListProps {
  patientId: string;
}

const DoctorConversationsList = ({ patientId }: DoctorConversationsListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<DoctorConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    const fetchDoctorConversations = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching doctor conversations for patient:", patientId);
        
        // First get all doctors assigned to this patient
        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .select("doctor_id")
          .eq("id", patientId)
          .single();
          
        if (patientError && !patientError.message.includes("No rows found")) throw patientError;
        
        // If patient has a primary doctor
        if (patient?.doctor_id) {
          console.log("Patient has primary doctor:", patient.doctor_id);
          
          // Fetch details of the primary doctor
          const { data: primaryDoctor, error: primaryDoctorError } = await supabase
            .from("doctors")
            .select("*")
            .eq("id", patient.doctor_id)
            .maybeSingle();
            
          if (primaryDoctorError && !primaryDoctorError.message.includes("No rows found")) throw primaryDoctorError;
          
          if (primaryDoctor) {
            // Get the last message between patient and this doctor
            const { data: lastMessage } = await supabase
              .from("chats")
              .select("*")
              .eq("patient_id", patientId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            const conversation: DoctorConversation = {
              id: primaryDoctor.id,
              name: `Dr. ${primaryDoctor.first_name} ${primaryDoctor.last_name}`,
              email: primaryDoctor.email,
              lastMessage: lastMessage?.message || "No messages",
              lastMessageTime: lastMessage?.created_at || primaryDoctor.updated_at,
              doctorId: primaryDoctor.id
            };
            
            setConversations([conversation]);
          }
        }
        
        // Now look for any other doctors that have created chats with this patient
        // First, get all scan records for this patient with their associated doctors
        const { data: scanRecords, error: scanError } = await supabase
          .from("scan_records")
          .select(`
            id,
            doctor_id,
            doctor:doctor_id (
              id, 
              first_name, 
              last_name, 
              email
            )
          `)
          .eq("patient_id", patientId)
          .not("doctor_id", "is", null);
          
        if (scanError) throw scanError;
        
        // Now get chats that might have been initiated by doctors
        const { data: chatData, error: chatError } = await supabase
          .from("chats")
          .select(`
            id,
            patient_id,
            sender_type,
            message,
            created_at
          `)
          .eq("patient_id", patientId)
          .neq("sender_type", "patient")
          .order("created_at", { ascending: false });
          
        if (chatError) throw chatError;
        
        if (scanRecords && scanRecords.length > 0) {
          // Create a map to track unique doctors
          const doctorMap = new Map<string, DoctorConversation>();
          
          // Process scan records to extract unique doctors
          scanRecords.forEach(record => {
            if (record.doctor && !doctorMap.has(record.doctor.id) && 
                (!patient?.doctor_id || record.doctor.id !== patient.doctor_id)) {
              
              // Find the most recent chat with this doctor
              const doctorChats = chatData?.filter(chat => 
                // This is a simplified approach - in a real app, you'd store doctor_id in chats
                chat.sender_type === "doctor"
              ) || [];
              
              const lastChat = doctorChats.length > 0 ? doctorChats[0] : null;
              
              doctorMap.set(record.doctor.id, {
                id: record.doctor.id,
                name: `Dr. ${record.doctor.first_name} ${record.doctor.last_name}`,
                email: record.doctor.email,
                lastMessage: lastChat?.message || "No messages",
                lastMessageTime: lastChat?.created_at || new Date().toISOString(), // Fixed: removed record.doctor.updated_at
                doctorId: record.doctor.id
              });
            }
          });
          
          // Add unique doctors to the conversations array
          if (doctorMap.size > 0) {
            setConversations(prevConversations => [...prevConversations, ...Array.from(doctorMap.values())]);
          }
        }
      } catch (error: any) {
        console.error("Error fetching doctor conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load your doctor conversations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (patientId) {
      fetchDoctorConversations();
    }
  }, [patientId, toast]);
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(
    conversation => conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle clicking on a conversation
  const handleConversationClick = (doctorId: string) => {
    navigate(`/patient/chat/${doctorId}`);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Doctor Conversations</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search doctors..."
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
                onClick={() => handleConversationClick(conversation.doctorId)}
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
                    {format(new Date(conversation.lastMessageTime), "MMM d, yyyy")}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-500">No doctor conversations found</p>
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
  );
};

export default DoctorConversationsList;
