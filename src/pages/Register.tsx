import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
  UserPlus,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type UserType = "doctor" | "patient" | undefined;

const Register = () => {
  const { userType } = useParams<{ userType: UserType }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [registeredDomains, setRegisteredDomains] = useState<string[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);

  // Fetch registered domains for doctor registration
  React.useEffect(() => {
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
        setEmailError("This email domain is not authorized for doctor registration");
        return false;
      }
    }
    
    setEmailError("");
    return true;
  };

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    
    setPasswordError("");
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email) || !validatePassword()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Sign up with email and password using AuthContext
      const { error, data } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
      });

      if (error) {
        throw error;
      }

      // Check if email confirmation is required
      if (data?.user && !data.user.email_confirmed_at) {
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account.",
        });
        
        // Redirect to login page
        navigate(`/login/${userType}`);
      } else {
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully.",
        });
        
        // Redirect to dashboard
        navigate(`/${userType}/dashboard`);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get the title and icon based on user type
  const getUserTypeDetails = () => {
    switch (userType) {
      case "doctor":
        return {
          title: "Doctor Registration",
          description: "Create an account to access patient records and collaboration tools.",
          icon: <User className="h-6 w-6 text-brand-600" />
        };
      case "patient":
        return {
          title: "Patient Registration",
          description: "Create an account to access your medical records and communicate with your doctors.",
          icon: <UserPlus className="h-6 w-6 text-brand-600" />
        };
      default:
        return {
          title: "Registration",
          description: "Create an account to access the platform.",
          icon: <UserPlus className="h-6 w-6 text-brand-600" />
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
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="First Name"
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoFocus
                    />
                    
                    <FormInput
                      label="Last Name"
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  
                  <FormInput
                    label="Email Address"
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={emailError}
                    disabled={isLoadingDomains}
                  />
                  
                  <FormInput
                    label="Password"
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  
                  <FormInput
                    label="Confirm Password"
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={passwordError}
                  />
                </CardContent>
                <CardFooter className="flex-col space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    disabled={loading || isLoadingDomains || !email || !password || !confirmPassword || !firstName || !lastName}
                  >
                    {loading ? "Processing..." : "Create Account"}
                  </Button>
                  
                  <div className="text-center text-xs text-gray-600">
                    Already have an account?{" "}
                    <Link
                      to={`/login/${userType}`}
                      className="font-medium text-brand-600 hover:text-brand-800"
                    >
                      Log in
                    </Link>
                  </div>
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

export default Register;
