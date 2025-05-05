
import React from "react";
import NewSidebar from "@/components/NewSidebar";
import AiChatBox from "@/components/AiChatBox";

const DoctorAiChat = () => {
  return (
    <NewSidebar type="doctor">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Radiology Assistant</h1>
          <p className="text-gray-600">
            Chat with RadiAI for technical information about radiology procedures, imaging techniques, and terminology.
          </p>
        </div>
        
        <AiChatBox />
      </div>
    </NewSidebar>
  );
};

export default DoctorAiChat;
