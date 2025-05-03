
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Upload, AlertCircle } from "lucide-react";

const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="border-0 shadow-subtle">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start border-coral-200 text-coral-600 hover:bg-coral-50 hover:text-coral-700 hover:border-coral-300"
            onClick={() => navigate("/patient/chat")}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat with Doctor
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
          >
            <Phone className="mr-2 h-4 w-4" />
            Request Follow-Up
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload New Scan
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Report an Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;
