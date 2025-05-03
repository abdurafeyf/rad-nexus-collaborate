
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, useLocation, Link } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Hospital,
  User,
  UserCheck,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; // Add this import

type UserType = "doctor" | "patient" | "admin" | undefined;

const Login = () => {
  const { userType } = useParams<{ userType: UserType }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast: uiToast } = useToast();
  const [searchParams] = useSearchParams();
  const { signIn, user, userType: currentUserType } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Get the "from" location for redirect after login
  const from = location.state?.from?.pathname || `/${userType}/dashboard`;

  // Check if there's a reset password token in URL
  const resetPasswordToken = searchParams.get('reset_password_token');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (currentUserType) {
        toast.info("Already logged in");
        navigate(`/${currentUserType}/dashboard`);
      }
    }
  }, [user, currentUserType, navigate]);

  // Handle email verification or password reset if token exists
  useEffect(() => {
    if (resetPasswordToken) {
      // Handle reset password flow
      toast.info("Please set a new password");
      // Add your reset password logic here
    }
  }, [resetPasswordToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (!userType) {
      toast.error("User type is required");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error, data } = await signIn(email, password, userType);

      if (error) {
        throw error;
      }

      toast.success("Login successful!");
      navigate(from);
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Get the title and icon based on user type
  const getUserTypeDetails = () => {
    switch (userType) {
      case "doctor":
        return {
          title: "Doctor Login",
          description: "Access patient records, reports and collaborate with colleagues.",
          icon: <User className="h-6 w-6 text-brand-600" />
        };
      case "patient":
        return {
          title: "Patient Login",
          description: "View your medical records and communicate with your care team.",
          icon: <UserCheck className="h-6 w-6 text-brand-600" />
        };
      case "admin":
        return {
          title: "Admin Login",
          description: "Manage your organization, users and settings.",
          icon: <Hospital className="h-6 w-6 text-brand-600" />
        };
      default:
        return {
          title: "Login",
          description: "Access your RaDixpert account.",
          icon: <User className="h-6 w-6 text-brand-600" />
        };
    }
  };

  const { title, description, icon } = getUserTypeDetails();

  // Send password reset email
  const sendPasswordResetEmail = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + `/login/${userType}`,
      });
      
      if (error) throw error;
      
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-brand-50">
      <NavBar />
      <main className="flex flex-grow items-center justify-center py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <Card className="border-brand-100 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  {icon}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">{title}</CardTitle>
                <CardDescription className="text-gray-600">{description}</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <FormInput
                    label="Email Address"
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                  
                  <FormInput
                    label="Password"
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-xs text-brand-600 hover:text-brand-800"
                      onClick={sendPasswordResetEmail}
                    >
                      Forgot password?
                    </button>
                  </div>
                </CardContent>
                
                <CardFooter className="flex-col space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    disabled={loading || !email || !password}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  {(userType === "doctor" || userType === "patient") && (
                    <div className="text-center text-xs text-gray-600">
                      Don't have an account?{" "}
                      <Link
                        to={`/register/${userType}`}
                        className="font-medium text-brand-600 hover:text-brand-800"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
