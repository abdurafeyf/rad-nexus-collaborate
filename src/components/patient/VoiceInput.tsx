
import React, { useState, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscriptReceived: (transcript: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscriptReceived,
  isLoading,
  setIsLoading
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError(`Microphone access denied: ${err.message}`);
      toast({
        title: "Microphone Error",
        description: `Could not access microphone: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve();
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const tracks = mediaRecorderRef.current?.stream?.getTracks();
        tracks?.forEach(track => track.stop());
        
        resolve();
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
    });
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1]; // Remove the data URL prefix
        
        // Get session for auth
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        
        if (!accessToken) {
          throw new Error("Authentication required");
        }

        // Call the edge function to transcribe the audio
        const response = await fetch(`https://ruueewpswsmmagpsxbvk.supabase.co/functions/v1/transcribe-audio`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audio: base64Data }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Transcription failed: ${errorText}`);
        }
        
        const data = await response.json();
        if (data.text) {
          onTranscriptReceived(data.text);
          toast({
            title: "Voice Recorded",
            description: "Your voice has been successfully transcribed.",
          });
        } else {
          throw new Error("No transcript received");
        }
      };
    } catch (err: any) {
      toast({
        title: "Transcription Error",
        description: err.message,
        variant: "destructive",
      });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          variant={isRecording ? "destructive" : "outline"}
          className={isRecording ? "animate-pulse" : ""}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isRecording ? (
            <>
              <MicOff className="mr-2 h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Record Voice Note
            </>
          )}
        </Button>
        {isRecording && (
          <span className="text-sm text-red-500 animate-pulse">Recording...</span>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VoiceInput;
