
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, ChevronRight, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

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
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch patient's primary doctor
  const { data: patientData } = useQuery({
    queryKey: ['patientWithDoctor', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          id,
          doctor_id,
          doctors:doctor_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("id", patientId)
        .single();
      
      if (error) {
        console.error("Error fetching patient's doctor:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!patientId
  });
  
  // Fetch all doctors who have created scan records for this patient
  const { data: scanRecordDoctors } = useQuery({
    queryKey: ['patientScanDoctors', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scan_records")
        .select(`
          doctor_id,
          doctors:doctor_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("patient_id", patientId)
        .not("doctor_id", "is", null);
      
      if (error) {
        console.error("Error fetching patient's scan record doctors:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!patientId
  });
  
  // Fetch chat messages
  const { data: chatMessages } = useQuery({
    queryKey: ['patientChatMessages', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching patient's chat messages:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!patientId
  });
  
  // Combine primary doctor and scan record doctors into conversations
  const conversations = React.useMemo(() => {
    const result: DoctorConversation[] = [];
    const addedDoctorIds = new Set<string>();
    
    // Add primary doctor if exists
    if (patientData?.doctor_id && patientData.doctors) {
      const doctor = patientData.doctors;
      const doctorId = doctor.id;
      
      const lastChat = chatMessages?.find(m => 
        // In a real app, you'd store doctor_id in chats
        m.sender_type === "doctor"
      );
      
      result.push({
        id: doctorId,
        name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        email: doctor.email,
        lastMessage: lastChat?.message || "No messages",
        lastMessageTime: lastChat?.created_at || new Date().toISOString(),
        doctorId: doctorId
      });
      
      addedDoctorIds.add(doctorId);
    }
    
    // Add scan record doctors
    scanRecordDoctors?.forEach(record => {
      if (record.doctor_id && record.doctors && !addedDoctorIds.has(record.doctor_id)) {
        const doctor = record.doctors;
        
        const lastChat = chatMessages?.find(m => 
          // In a real app, you'd store doctor_id in chats
          m.sender_type === "doctor"
        );
        
        result.push({
          id: doctor.id,
          name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
          email: doctor.email,
          lastMessage: lastChat?.message || "No messages",
          lastMessageTime: lastChat?.created_at || new Date().toISOString(),
          doctorId: doctor.id
        });
        
        addedDoctorIds.add(doctor.id);
      }
    });
    
    // If no doctors are found, add a dummy one for demonstration
    if (result.length === 0) {
      result.push({
        id: "demo-doctor-1",
        name: "Dr. John Smith",
        email: "john.smith@radixpert.com",
        lastMessage: "Hello, I'm your doctor. How can I help you today?",
        lastMessageTime: new Date().toISOString(),
        doctorId: "demo-doctor-1"
      });
    }
    
    return result;
  }, [patientData, scanRecordDoctors, chatMessages]);
  
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
        {filteredConversations.length > 0 ? (
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
            <div className="mt-6">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => navigate("/patient/find-doctor")}
              >
                <UserPlus className="h-4 w-4" />
                Find a Doctor
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorConversationsList;
