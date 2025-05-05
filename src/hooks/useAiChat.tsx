
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
};

export const useAiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Format chat history for the API
      const chatHistory = messages.map(({ role, content }) => ({
        role,
        content,
      }));
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('radiology-ai-chat', {
        body: { message, chatHistory },
      });
      
      if (error) throw error;
      
      // Format the AI response with consistent styling
      let aiResponse = data.reply;
      
      // Add appropriate formatting for medical terms and lists if needed
      if (aiResponse.includes("cardiomegaly") && !aiResponse.includes("**Cardiomegaly**")) {
        aiResponse = aiResponse.replace(/cardiomegaly/gi, "**Cardiomegaly**");
      }
      
      // Ensure lists have proper formatting
      if (aiResponse.includes("factors") || aiResponse.includes("include")) {
        const listPattern = /(can result from various factors, including:|can be caused by:|can include:)/i;
        if (listPattern.test(aiResponse) && !aiResponse.includes("- ")) {
          // Add bullet points for readability
          aiResponse = aiResponse.replace(
            /(can result from various factors, including:|can be caused by:|can include:)\s+([^-\n])/i, 
            "$1\n\n- $2"
          );
          aiResponse = aiResponse.replace(/\.\s+([A-Z][^.\n]+?):\s+/g, ".\n\n- **$1**: ");
        }
      }
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error sending message to AI:', error);
      toast({
        title: "Error",
        description: "Failed to get a response from the AI assistant.",
        variant: "destructive"
      });
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I couldn't process your request. Please try again later.",
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
};
