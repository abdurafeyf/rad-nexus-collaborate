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
  const [isSending, setIsSending] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [typingStatus, setTypingStatus] = useState<boolean>(false);

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
    
    // Enhanced real-time subscription
    const channel = supabase
      .channel('chats-channel')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'chats', 
          filter: `patient_id=eq.${patientId}` 
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            // Only add the message if it's not from the current user
            // or if it's not the optimistic message we just added
            setMessages(prevMessages => {
              const isDuplicate = prevMessages.some(msg => 
                msg.id === newMessage.id || 
                (msg.id === `temp-${newMessage.id}` && msg.sender_type === "doctor")
              );
              return isDuplicate ? prevMessages : [...prevMessages, newMessage];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message;
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);
  
  // Typing indicator subscription
  useEffect(() => {
    if (!patientId) return;
    
    const typingChannel = supabase
      .channel('typing-channel')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'patients', 
          filter: `id=eq.${patientId}` 
        },
        (payload) => {
          setTypingStatus(payload.new.is_typing);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [patientId]);
  
  // Scroll to bottom when new messages come in
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() === "" || !patientId || !currentDoctor) return;
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      message: newMessage.trim(),
      sender_type: "doctor",
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
      const { data, error } = await supabase
        .from("chats")
        .insert({
          patient_id: patientId,
          message: newMessage.trim(),
          sender_type: "doctor",
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? data : msg)
      );
      
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
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
    <NewSidebar type="doctor">
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
              <div className="space-y-6">
                {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-gray-50 border border-gray-100 px-4 py-1 text-sm text-gray-500">
                        {format(new Date(date), 'MMMM d, yyyy')}
                      </div>
                    </div>
                    {dateMessages.map((msg) => {
                      const isDoctor = msg.sender_type === "doctor";
                      const senderName = isDoctor 
                        ? `Dr. ${currentDoctor?.first_name} ${currentDoctor?.last_name}`
                        : patient?.name || "Patient";
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isDoctor ? "justify-end" : "justify-start"}`}
                        >
                          {!isDoctor && (
                            <div 
                              className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600"
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
                            className={`group flex max-w-[80%] flex-col ${isDoctor ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-2 transition-all duration-200 hover:scale-[1.02] ${
                                isDoctor
                                  ? "bg-teal-500 text-white"
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
                                  isDoctor ? "text-teal-100" : "text-gray-400"
                                }`}
                              >
                                {format(new Date(msg.created_at), "h:mm a")}
                              </div>
                            </div>
                          </div>
                          {isDoctor && (
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
                        </div>
                      );
                    })}
                  </div>
                ))}
                {typingStatus && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
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
                className="flex-1 border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                disabled={isSending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className="shrink-0 h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600"
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

export default PatientChat;
