
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  UserCheck,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type UserType = "doctor" | "patient" | "admin" | undefined;

const Login = () => {
  const { userType } = useParams<{ userType: UserType }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<"email" | "password" | "changePassword">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [registeredDomains, setRegisteredDomains] = useState<string[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);

  // Check if there's a reset password token in URL
  const resetPasswordToken = searchParams.get('reset_password_token');

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

  // Check if there's a reset token and handle it
  useEffect(() => {
    if (resetPasswordToken) {
      // If there's a reset token, go directly to change password step
      setStep("changePassword");
      setRequirePasswordChange(true);
    }

    // Check if user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // User is already logged in, redirect to appropriate dashboard
        toast({
          title: "Already Logged In",
          description: "You're already logged in.",
        });
        navigate(`/${userType}/dashboard`);
      }
    };

    checkSession();
  }, [resetPasswordToken, navigate, userType, toast]);

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

  const validatePasswordMatch = (): boolean => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    
    setPasswordError("");
    return true;
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === "email") {
      if (!validateEmail(email)) {
        return;
      }
      
      // Proceed to password step if email is valid
      setStep("password");
    } else if (step === "password") {
      await handleLogin();
    } else if (step === "changePassword") {
      await handlePasswordChange();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    
    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message);
        throw error;
      }

      console.log("Login successful:", data);

      // Check if this might be a patient's first login (temporary password)
      if (userType === "patient") {
        // This is a simplified check. In reality, there should be a flag in the database
        // or a claim in the JWT to indicate if a password change is required
        const isTemporaryPassword = password.length >= 10 && 
          /[A-Z]/.test(password) && 
          /[a-z]/.test(password) && 
          /[0-9]/.test(password) &&
          /[!@#$%^&*()_+]/.test(password);
        
        if (isTemporaryPassword) {
          setRequirePasswordChange(true);
          setStep("changePassword");
          setLoading(false);
          return;
        }
      }

      // Check if doctor email is verified
      if (userType === "doctor") {
        // In a real app with proper flow, you'd handle unverified doctor emails
        // The email_confirmed_at field tells us if the email is verified
        if (data.user && !data.user.email_confirmed_at) {
          toast({
            title: "Email Not Verified",
            description: "Please check your email to verify your account.",
            variant: "default", // Using "default" variant which is allowed
          });
        }
      }

      toast({
        title: "Login Successful",
        description: `Welcome back! You're now logged in.`,
      });
      
      // Redirect to appropriate dashboard based on user type
      navigate(`/${userType}/dashboard`);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordMatch()) {
      return;
    }

    setLoading(true);

    try {
      let result;
      
      // If it's from a reset token
      if (resetPasswordToken) {
        // Update password using the token
        result = await supabase.auth.updateUser({
          password: newPassword
        });
      } else {
        // Update password while logged in (first-time login case)
        result = await supabase.auth.updateUser({
          password: newPassword
        });
      }

      if (result.error) throw result.error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      
      // Redirect to dashboard
      navigate(`/${userType}/dashboard`);
    } catch (error: any) {
      toast({
        title: "Password Update Failed",
        description: error.message || "An error occurred while updating password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send verification/reset email
  const sendVerificationEmail = async () => {
    if (!email) return;
    
    try {
      // Using the correct method from Supabase v2 API
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + `/login/${userType}`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Email Sent",
        description: userType === "doctor" 
          ? "Please check your inbox to verify your account." 
          : "Please check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
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
                  {step === "changePassword" ? <Lock className="h-6 w-6 text-brand-600" /> : icon}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  {step === "changePassword" ? "Create New Password" : title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {step === "changePassword" 
                    ? "Please create a strong password for your account" 
                    : description}
                </CardDescription>
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
                  ) : step === "password" ? (
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
                          onClick={sendVerificationEmail}
                        >
                          Forgot password?
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        {requirePasswordChange 
                          ? "You need to change your temporary password to continue." 
                          : "Create a new secure password for your account."}
                      </p>
                      <FormInput
                        label="New Password"
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoFocus
                      />
                      <FormInput
                        label="Confirm Password"
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={passwordError}
                      />
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex-col space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    disabled={loading || isLoadingDomains || 
                      (step === "email" ? !email : 
                       step === "password" ? !password :
                       !newPassword || !confirmPassword)}
                  >
                    {loading
                      ? "Processing..."
                      : isLoadingDomains
                      ? "Loading..."
                      : step === "email"
                      ? "Continue"
                      : step === "password"
                      ? "Log In"
                      : "Set New Password"}
                  </Button>
                  
                  {userType === "doctor" && step === "password" && (
                    <div className="text-center text-xs text-gray-600">
                      <button
                        type="button"
                        className="font-medium text-brand-600 hover:text-brand-800"
                        onClick={sendVerificationEmail}
                      >
                        Resend verification email
                      </button>
                    </div>
                  )}
                  
                  {userType === "patient" && step === "email" && (
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
