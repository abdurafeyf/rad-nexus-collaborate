
import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Send, Trash2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiChat, ChatMessage } from "@/hooks/useAiChat";
import { cn } from "@/lib/utils";

interface AiChatBoxProps {
  className?: string;
}

const AiChatBox: React.FC<AiChatBoxProps> = ({ className }) => {
  const { messages, isLoading, sendMessage, clearChat } = useAiChat();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const renderMessageContent = (content: string) => {
    return content.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };
  
  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-teal-500" />
            RadiAI Assistant
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat}
            disabled={messages.length === 0 || isLoading}
            className="h-8 px-2 text-gray-500 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="bg-teal-50 rounded-full p-3 mb-4">
              <Bot className="h-8 w-8 text-teal-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Welcome to RadiAI</h3>
            <p className="text-gray-500 max-w-md">
              I can answer questions about radiology procedures, imaging techniques, and medical terminology. How can I assist you today?
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isUser = message.role === "user";
            
            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2 max-w-[85%]",
                  isUser ? "ml-auto" : "mr-auto"
                )}
              >
                <div 
                  className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    isUser ? "bg-coral-100 text-coral-600 order-2" : "bg-teal-100 text-teal-600"
                  )}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                
                <div 
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm",
                    isUser ? "bg-coral-500 text-white" : "bg-gray-100 text-gray-800"
                  )}
                >
                  {renderMessageContent(message.content)}
                  {message.timestamp && (
                    <div className={cn(
                      "text-[10px] mt-1",
                      isUser ? "text-coral-100" : "text-gray-400"
                    )}>
                      {format(new Date(message.timestamp), "h:mm a")}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {isLoading && (
          <div className="flex items-start gap-2 max-w-[85%] mr-auto">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3 text-gray-500">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Ask about radiology procedures, imaging, or terminology..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-grow"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-teal-500 hover:bg-teal-600"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AiChatBox;
