
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { 
  Hospital,
  User,
  UserCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type UserType = "doctor" | "patient" | "admin" | undefined;

const Login = () => {
  const { userType } = useParams<{ userType: UserType }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [registeredDomains, setRegisteredDomains] = useState<string[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);

  // Fetch registered domains from Supabase
  useEffect(() => {
    const fetchRegisteredDomains = async () => {
      if (userType === "doctor") {
        setIsLoadingDomains(true);
        try {
          const { data, error } = await supabase
            .from("authorized_domains")
            .select("domain");
          
          if (error) {
            console.error("Error fetching authorized domains:", error);
            toast({
              title: "Error",
              description: "Failed to load authorized domains. Please try again later.",
              variant: "destructive",
            });
          } else if (data) {
            setRegisteredDomains(data.map(item => item.domain));
          }
        } catch (error) {
          console.error("Exception fetching domains:", error);
        } finally {
          setIsLoadingDomains(false);
        }
      }
    };

    fetchRegisteredDomains();
  }, [userType, toast]);

  const validateEmail = (email: string): boolean => {
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    
    if (userType === "doctor") {
      const domain = email.split("@")[1];
      
      if (registeredDomains.length > 0 && !registeredDomains.includes(domain)) {
        setEmailError("This email domain is not authorized for doctor access");
        return false;
      }
    }
    
    setEmailError("");
    return true;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }
    
    if (step === "email") {
      // Proceed to password step if email is valid
      setStep("password");
    } else {
      // Process login if on password step
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        
        // Show success toast
        toast({
          title: "Login Successful",
          description: `Logged in as ${userType} with email ${email}`,
        });
        
        // Redirect to appropriate dashboard based on user type
        navigate(`/dashboard/${userType}`);
      }, 1500);
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
              <form onSubmit={handleContinue}>
                <CardContent className="space-y-4">
                  {step === "email" ? (
                    <FormInput
                      label="Email Address"
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={emailError}
                      autoFocus
                      disabled={isLoadingDomains}
                    />
                  ) : (
                    <>
                      <div className="rounded-md bg-gray-50 p-3 text-sm">
                        <div className="font-medium">{email}</div>
                        <button
                          type="button"
                          onClick={() => setStep("email")}
                          className="mt-1 text-xs text-brand-600 hover:text-brand-800"
                        >
                          Change email
                        </button>
                      </div>
                      
                      <FormInput
                        label="Password"
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                      />
                      
                      <div className="text-right">
                        <button
                          type="button"
                          className="text-xs text-brand-600 hover:text-brand-800"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex-col space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    disabled={loading || isLoadingDomains || (step === "email" ? !email : !password)}
                  >
                    {loading
                      ? "Processing..."
                      : isLoadingDomains
                      ? "Loading..."
                      : step === "email"
                      ? "Continue"
                      : "Log In"}
                  </Button>
                  
                  {userType === "patient" && (
                    <div className="text-center text-xs text-gray-600">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        className="font-medium text-brand-600 hover:text-brand-800"
                        onClick={() => navigate("/register/patient")}
                      >
                        Sign up
                      </button>
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
