
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Stethoscope, Upload } from "lucide-react";

const QuickActionsPanel = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-0 shadow-subtle">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button 
          variant="outline" 
          className="justify-between border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 rounded-lg w-full"
          onClick={() => navigate("/patient/upload")}
        >
          <span className="flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            Upload Medical Scan
          </span>
          <span className="rounded-full bg-teal-100 text-teal-700 text-xs px-2 py-1">
            New
          </span>
        </Button>
        
        <Button 
          variant="outline" 
          className="justify-between border-coral-200 text-coral-600 hover:bg-coral-50 hover:text-coral-700 hover:border-coral-300 rounded-lg w-full"
          onClick={() => navigate("/patient/conversations")}
        >
          <span className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Doctor
          </span>
        </Button>
        
        <Button 
          variant="outline" 
          className="justify-between border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 rounded-lg w-full"
          onClick={() => navigate("/patient/ai-chat")}
        >
          <span className="flex items-center">
            <Stethoscope className="mr-2 h-4 w-4" />
            Ask AI Assistant
          </span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;
