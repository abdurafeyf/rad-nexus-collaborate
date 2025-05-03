
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface ForgotPasswordProps {
  onCancel: () => void;
  userType: string;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onCancel, userType }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + `/login/${userType}?reset_password=true`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Reset Email Sent",
        description: "Please check your inbox for password reset instructions.",
      });
      
      onCancel();
    } catch (error: any) {
      toast({
        title: "Failed to Send Reset Email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
          <Mail className="h-6 w-6 text-brand-600" />
        </div>
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address</label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-2">
          <Button 
            type="submit" 
            className="w-full bg-brand-600 hover:bg-brand-700" 
            disabled={isSubmitting || !email}
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={onCancel}
          >
            Back to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ForgotPassword;
