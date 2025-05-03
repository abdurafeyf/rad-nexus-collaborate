
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Mic, User } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import NewSidebar from "@/components/NewSidebar";

type Message = {
  id: string;
  message: string | null;
  sender_type: string;
  created_at: string;
  file_path: string | null;
  file_type: string | null;
  is_voice_note: boolean | null;
};

type Patient = {
  id: string;
  name: string;
  email: string;
};

type Doctor = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
};

const PatientChat = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);

  // Fetch doctor information
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
      }
    };
    
    fetchDoctorInfo();
  }, [user]);
  
  // Fetch patient info
  useEffect(() => {
    if (!patientId) return;
    
    const fetchPatientInfo = async () => {
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("id, name, email")
          .eq("id", patientId)
          .single();
        
        if (error) throw error;
        
        setPatient(data as Patient);
      } catch (error: any) {
        console.error("Error fetching patient:", error);
        toast({
          title: "Error",
          description: "Could not load patient information.",
          variant: "destructive"
        });
        navigate("/doctor/dashboard");
      }
    };
    
    fetchPatientInfo();
  }, [patientId, navigate]);

  // Fetch messages
  useEffect(() => {
    if (!patientId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("chats")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: true });
          
        if (error) throw error;
        
        setMessages(data as Message[]);
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Could not load messages.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('chats-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chats', filter: `patient_id=eq.${patientId}` },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);
  
  // Scroll to bottom when new messages come in
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() === "" || !patientId || !currentDoctor) return;
    
    try {
      const { error } = await supabase
        .from("chats")
        .insert({
          patient_id: patientId,
          message: newMessage.trim(),
          sender_type: "doctor",
        });
        
      if (error) throw error;
      
      // Clear input after sending
      setNewMessage("");
      
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <NewSidebar type="doctor">
      <div className="flex h-screen flex-col bg-gray-50">
        {/* Chat header */}
        <div className="border-b bg-white p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-4 flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="-ml-3"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="ml-2 text-xl font-bold">
                Chat with {patient?.name || "Patient"}
              </h2>
            </div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="container mx-auto max-w-4xl py-6">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-teal-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow-subtle">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-500">
                  <User className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No messages yet</h3>
                <p className="text-gray-500">
                  Start the conversation with {patient?.name} by sending a message.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isDoctor = msg.sender_type === "doctor";
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isDoctor ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isDoctor
                            ? "bg-teal-500 text-white"
                            : "bg-white shadow-subtle"
                        }`}
                      >
                        {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                        {msg.file_path && (
                          <div className="mt-2">
                            <a
                              href={msg.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm underline"
                            >
                              View attachment
                            </a>
                          </div>
                        )}
                        <div
                          className={`mt-1 text-xs ${
                            isDoctor ? "text-teal-100" : "text-gray-400"
                          }`}
                        >
                          {format(new Date(msg.created_at), "h:mm a")}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t bg-white p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="h-5 w-5 text-gray-500" />
              </Button>
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border-gray-200"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="shrink-0 bg-teal-500 hover:bg-teal-600"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </NewSidebar>
  );
};

export default PatientChat;
