
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, AlertCircle } from "lucide-react";

const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="border-0 shadow-subtle h-full">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start rounded-lg border-coral-200 text-coral-600 hover:bg-coral-50 hover:text-coral-700 hover:border-coral-300"
            onClick={() => navigate("/patient/chat")}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chat with Doctor</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start rounded-lg border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
            onClick={() => navigate("/patient/messages")}
          >
            <Phone className="mr-2 h-4 w-4" />
            <span>View Messages</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
            onClick={() => navigate("/patient/support")}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>Contact Support</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;
