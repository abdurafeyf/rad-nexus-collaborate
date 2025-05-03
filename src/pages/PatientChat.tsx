
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, PaperclipIcon, SendIcon, Upload, Mic, Loader2, StopCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Patient type definition
type Patient = {
  id: string;
  name: string;
  email: string;
  status: "active" | "passive";
};

// Chat message type definition
type ChatMessage = {
  id: string;
  patient_id: string;
  sender_type: "doctor" | "patient";
  message: string | null;
  file_path: string | null;
  file_type: string | null;
  is_voice_note: boolean | null;
  created_at: string;
};

const PatientChat = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Fetch patient data and messages
  const fetchPatientAndMessages = async () => {
    if (!patientId) return;

    setIsLoading(true);

    try {
      // Fetch patient info
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id, name, email, status")
        .eq("id", patientId)
        .single();

      if (patientError) {
        throw patientError;
      }

      // Explicitly cast the status to "active" | "passive"
      setPatient({
        ...patientData,
        status: patientData.status as "active" | "passive"
      });

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("chats")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      setMessages(messagesData as ChatMessage[]);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
      navigate("/doctor/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientAndMessages();
    
    // Set up subscription to listen for new messages
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chats',
            filter: `patient_id=eq.${patientId}`
          }, 
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages(prev => [...prev, newMessage]);
          }
      )
      .subscribe();
    
    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Send a new text message
  const sendMessage = async () => {
    if (!patient || !newMessage.trim()) return;

    setIsSending(true);

    try {
      const { error } = await supabase.from("chats").insert({
        patient_id: patient.id,
        sender_type: "doctor",
        message: newMessage,
      });

      if (error) {
        throw error;
      }

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Upload and send a file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!patient || !event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const fileType = file.type;
    const filePath = `${patient.id}/${Date.now()}-${file.name}`;

    setIsUploading(true);

    try {
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("patient_files")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL for the file
      const { data } = supabase.storage
        .from("patient_files")
        .getPublicUrl(filePath);

      // Send message with file reference
      const { error: messageError } = await supabase.from("chats").insert({
        patient_id: patient.id,
        sender_type: "doctor",
        file_path: data.publicUrl,
        file_type: fileType,
      });

      if (messageError) {
        throw messageError;
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast({
        title: "Error uploading file",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          setAudioChunks([...chunks]);
        }
      });
      
      setAudioRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Recording your voice message...",
      });
    } catch (error: any) {
      toast({
        title: "Error starting recording",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Stop voice recording and upload
  const stopRecording = () => {
    if (!audioRecorder || !patient) return;
    
    audioRecorder.addEventListener("stop", async () => {
      try {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        
        setIsUploading(true);
        
        // Upload voice note to storage
        const filePath = `${patient.id}/voice-${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("patient_files")
          .upload(filePath, audioFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL for the audio
        const { data } = supabase.storage
          .from("patient_files")
          .getPublicUrl(filePath);
          
        // Send message with voice note reference
        const { error: messageError } = await supabase.from("chats").insert({
          patient_id: patient.id,
          sender_type: "doctor",
          file_path: data.publicUrl,
          file_type: "audio/webm",
          is_voice_note: true,
        });
        
        if (messageError) {
          throw messageError;
        }
        
        // Reset recording state
        setAudioChunks([]);
      } catch (error: any) {
        toast({
          title: "Error uploading voice note",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    });
    
    audioRecorder.stop();
    setIsRecording(false);
    
    // Stop all tracks in the stream
    audioRecorder.stream.getTracks().forEach((track) => track.stop());
  };

  // Format chat timestamp
  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), "p");
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Determine if a message is from the doctor
  const isDoctor = (message: ChatMessage) => message.sender_type === "doctor";

  // Play audio message
  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <main className="flex-grow bg-gray-50">
          <div className="container py-8">
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <main className="flex-grow bg-gray-50">
          <div className="container py-8">
            <div className="flex flex-col items-center py-16">
              <h2 className="mb-4 text-2xl font-bold">Patient Not Found</h2>
              <Button
                onClick={() => navigate("/doctor/dashboard")}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-grow bg-gray-50">
        <div className="container max-w-4xl py-8">
          {/* Back navigation */}
          <Button
            onClick={() => navigate(`/doctor/patients/${patientId}`)}
            variant="ghost"
            className="mb-6 -ml-3"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patient
          </Button>

          {/* Chat header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Chat with {patient.name}</h1>
              <p className="text-muted-foreground">{patient.email}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              patient.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {patient.status === 'active' ? 'Active' : 'Passive'}
            </div>
          </div>

          {/* Chat container */}
          <Card className="mb-4 flex h-[calc(100vh-300px)] flex-col overflow-hidden border-brand-100 shadow-md">
            {/* Messages area */}
            <div className="flex-grow overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-brand-50 p-3">
                    <MessageIcon className="h-6 w-6 text-brand-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No messages yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start the conversation with {patient.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        isDoctor(message) ? "justify-end" : ""
                      }`}
                    >
                      <div
                        className={`flex max-w-[80%] ${
                          isDoctor(message) ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className={cn("h-8 w-8", isDoctor(message) ? "ml-2" : "mr-2")}>
                          <AvatarFallback className={isDoctor(message) ? "bg-brand-500 text-white" : "bg-muted"}>
                            {isDoctor(message)
                              ? "DR"
                              : getInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div
                            className={cn(
                              "rounded-lg p-3",
                              isDoctor(message)
                                ? "bg-brand-500 text-white"
                                : "bg-gray-100"
                            )}
                          >
                            {message.message && (
                              <p className="break-words">{message.message}</p>
                            )}
                            
                            {message.file_path && message.is_voice_note && (
                              <div className="mt-1 flex items-center">
                                <button
                                  onClick={() => playAudio(message.file_path!)}
                                  className="flex items-center rounded-md bg-white bg-opacity-20 px-3 py-1 text-sm"
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="mr-2"
                                  >
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                  </svg>
                                  Voice Message
                                </button>
                              </div>
                            )}
                            
                            {message.file_path && !message.is_voice_note && (
                              <div>
                                {message.file_type?.startsWith("image/") ? (
                                  <a
                                    href={message.file_path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={message.file_path}
                                      alt="Shared image"
                                      className="mt-2 max-h-60 rounded-md"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={message.file_path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={cn(
                                      "mt-2 flex items-center rounded-md",
                                      isDoctor(message)
                                        ? "text-white"
                                        : "text-blue-600"
                                    )}
                                  >
                                    <PaperclipIcon className="mr-1 h-4 w-4" />
                                    File attachment
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <div
                            className={cn(
                              "mt-1 text-xs text-muted-foreground",
                              isDoctor(message) ? "text-right" : ""
                            )}
                          >
                            {formatMessageTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={endOfMessagesRef} />
                </div>
              )}
            </div>

            {/* Message input area */}
            <div className="border-t bg-white p-4 shadow-inner">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PaperclipIcon className="h-4 w-4" />
                      )}
                      <span className="sr-only">Attach file</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  type="button"
                  size="icon"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isUploading}
                >
                  {isRecording ? (
                    <StopCircle className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {isRecording ? "Stop recording" : "Record voice"}
                  </span>
                </Button>

                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow"
                  disabled={isSending || isRecording}
                />

                <Button
                  type="submit"
                  disabled={!newMessage.trim() || isSending || isRecording}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <SendIcon className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
      
      {/* Hidden audio element for playing voice messages */}
      <audio ref={audioRef} className="hidden" controls />
    </div>
  );
};

// Message icon component
const MessageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default PatientChat;
