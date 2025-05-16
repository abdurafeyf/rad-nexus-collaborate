
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, User } from "lucide-react";
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
  is_typing?: boolean;
};

type Doctor = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
};

const PatientChatPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { doctorId } = useParams();
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  
  // Redirect to conversations page if no doctorId is provided
  useEffect(() => {
    if (!doctorId) {
      navigate("/patient/conversations");
    }
  }, [doctorId, navigate]);
  
  // Fetch patient information
  useEffect(() => {
    const fetchPatientInfo = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("id, name, email, doctor_id, is_typing")
          .eq("email", user.email)
          .single();
        
        if (error) throw error;
        
        setPatient(data);
        
        // Get doctor info if doctorId is provided in the URL
        if (doctorId) {
          const { data: doctorData, error: doctorError } = await supabase
            .from("doctors")
            .select("id, user_id, first_name, last_name")
            .eq("id", doctorId)
            .single();
            
          if (doctorError) throw doctorError;
          
          setDoctor(doctorData);
        }
      } catch (error: any) {
        console.error("Error fetching patient:", error);
        toast({
          title: "Error",
          description: "Could not load your information.",
          variant: "destructive"
        });
      }
    };
    
    fetchPatientInfo();
  }, [user, doctorId, toast]);

  // Fetch messages
  useEffect(() => {
    if (!patient?.id || !doctorId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("chats")
          .select("*")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: true });
          
        if (error) throw error;
        
        // Filter messages specifically for the current doctor
        const doctorMessages = data.filter((msg: Message) => {
          if (msg.sender_type === "patient") return true; // Show all patient messages
          
          // For non-patient messages, we need to check if they're from this doctor
          // This is simplified and might need refinement based on your actual data structure
          return true; // For now, include all messages
        });
        
        setMessages(doctorMessages as Message[]);
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
    
    // Set up real-time subscription
    const channel = supabase
      .channel('chats-channel')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'chats', 
          filter: `patient_id=eq.${patient.id}` 
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            if (newMessage.sender_type === "doctor") {
              setMessages(prevMessages => {
                const isDuplicate = prevMessages.some(msg => msg.id === newMessage.id);
                return isDuplicate ? prevMessages : [...prevMessages, newMessage];
              });
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [patient, doctorId, toast]);
  
  // Scroll to bottom when new messages come in
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() === "" || !patient?.id || !doctorId) return;
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      message: newMessage.trim(),
      sender_type: "patient",
      created_at: new Date().toISOString(),
      file_path: null,
      file_type: null,
      is_voice_note: false
    };
    
    // Optimistic update
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setIsSending(true);
    
    try {
      // Update patient typing status if the patient object exists and has an id
      if (patient?.id) {
        await supabase
          .from("patients")
          .update({ is_typing: true })
          .eq("id", patient.id);
      }
      
      const { data, error } = await supabase
        .from("chats")
        .insert({
          patient_id: patient.id,
          message: newMessage.trim(),
          sender_type: "patient",
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? data : msg)
      );
      
      // Reset typing status if the patient object exists and has an id
      if (patient?.id) {
        await supabase
          .from("patients")
          .update({ is_typing: false })
          .eq("id", patient.id);
      }
      
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
      
      // Reset typing status on error too if the patient object exists and has an id
      if (patient?.id) {
        await supabase
          .from("patients")
          .update({ is_typing: false })
          .eq("id", patient.id);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.created_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <NewSidebar type="patient">
      <div className="flex h-screen flex-col bg-gray-50">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="-ml-3 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="ml-2 text-lg font-semibold text-gray-900">
                Chat with {doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : "Doctor"}
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
                  Start the conversation with your doctor by sending a message.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-gray-50 border border-gray-100 px-4 py-1 text-sm text-gray-500">
                        {format(new Date(date), 'MMMM d, yyyy')}
                      </div>
                    </div>
                    {dateMessages.map((msg) => {
                      const isPatient = msg.sender_type === "patient";
                      const senderName = isPatient 
                        ? patient?.name || "You" 
                        : doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : "Doctor";
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isPatient ? "justify-end" : "justify-start"}`}
                        >
                          {!isPatient && (
                            <div 
                              className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-500"
                              title={senderName}
                            >
                              <span className="text-xs font-medium">
                                {getInitials(senderName)}
                              </span>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                {senderName}
                              </div>
                            </div>
                          )}
                          <div 
                            className={`group flex max-w-[80%] flex-col ${isPatient ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-2 transition-all duration-200 hover:scale-[1.02] ${
                                isPatient
                                  ? "bg-coral-500 text-white"
                                  : "bg-gray-100 text-gray-900"
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
                                  isPatient ? "text-coral-100" : "text-gray-400"
                                }`}
                              >
                                {format(new Date(msg.created_at), "h:mm a")}
                              </div>
                            </div>
                          </div>
                          {isPatient && (
                            <div 
                              className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-coral-100 text-coral-500"
                              title={senderName}
                            >
                              <span className="text-xs font-medium">
                                {getInitials(senderName)}
                              </span>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                {senderName}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t bg-white p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0 hover:bg-gray-100">
                <Paperclip className="h-5 w-5 text-gray-500" />
              </Button>
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border-gray-200 focus:border-coral-500 focus:ring-1 focus:ring-coral-500"
                disabled={isSending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className="shrink-0 h-10 w-10 rounded-full bg-coral-500 hover:bg-coral-600"
              >
                {isSending ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </NewSidebar>
  );
};

export default PatientChatPage;
