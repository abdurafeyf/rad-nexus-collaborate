
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const OrganizationRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState({
    instituteName: "",
    adminName: "",
    adminEmail: "",
    plan: "monthly",
    domains: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formState.instituteName.trim()) {
      newErrors.instituteName = "Institute name is required";
    }
    
    if (!formState.adminName.trim()) {
      newErrors.adminName = "Admin name is required";
    }
    
    if (!formState.adminEmail.trim()) {
      newErrors.adminEmail = "Admin email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.adminEmail)) {
      newErrors.adminEmail = "Please enter a valid email address";
    }
    
    if (!formState.domains.trim()) {
      newErrors.domains = "At least one domain is required";
    } else {
      const domainList = formState.domains.split(",").map(d => d.trim());
      const invalidDomains = domainList.filter(d => !d.includes('.') || d.startsWith('@'));
      if (invalidDomains.length > 0) {
        newErrors.domains = "Please enter valid domains (e.g., hospital.com)";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // First, insert the organization record
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          institute_name: formState.instituteName,
          admin_name: formState.adminName,
          admin_email: formState.adminEmail,
          plan: formState.plan
        })
        .select()
        .single();
      
      if (orgError) {
        throw orgError;
      }
      
      // Parse and insert domains
      const domainList = formState.domains
        .split(',')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);
      
      const domainsToInsert = domainList.map(domain => ({
        organization_id: orgData.id,
        domain: domain
      }));
      
      const { error: domainsError } = await supabase
        .from('authorized_domains')
        .insert(domainsToInsert);
      
      if (domainsError) {
        throw domainsError;
      }
      
      toast({
        title: "Registration Successful!",
        description: "Your organization has been registered successfully.",
        duration: 5000,
      });
      
      setLoading(false);
      navigate("/register/success");
      
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Registration Failed",
        description: error.message || "There was an error registering your organization. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-grow bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
              Register Your Healthcare Organization
            </h1>

            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>
                  Register your healthcare organization to provide secure access for your team.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <FormInput
                    label="Institute Name"
                    id="instituteName"
                    name="instituteName"
                    placeholder="e.g., Central City Hospital"
                    value={formState.instituteName}
                    onChange={handleChange}
                    error={errors.instituteName}
                  />
                  
                  <FormInput
                    label="Admin Name"
                    id="adminName"
                    name="adminName"
                    placeholder="e.g., Dr. Jane Smith"
                    value={formState.adminName}
                    onChange={handleChange}
                    error={errors.adminName}
                  />
                  
                  <FormInput
                    label="Admin Email"
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    placeholder="e.g., admin@hospital.com"
                    value={formState.adminEmail}
                    onChange={handleChange}
                    error={errors.adminEmail}
                  />

                  <div className="space-y-2">
                    <label htmlFor="plan" className="text-sm font-medium">
                      Subscription Plan
                    </label>
                    <Select
                      name="plan"
                      value={formState.plan}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, plan: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">
                          Monthly Plan - $299/month
                        </SelectItem>
                        <SelectItem value="yearly">
                          Yearly Plan - $2,990/year (Save 2 months!)
                        </SelectItem>
                        <SelectItem value="enterprise">
                          Enterprise - Custom pricing
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <FormInput
                    label="Authorized Email Domains"
                    id="domains"
                    name="domains"
                    placeholder="e.g., hospital.com, clinic.org"
                    description="Comma-separated list of email domains authorized to access your organization"
                    value={formState.domains}
                    onChange={handleChange}
                    error={errors.domains}
                  />
                  
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-2 font-medium text-gray-900">Plan Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium capitalize text-gray-900">
                          {formState.plan}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium text-gray-900">
                          {formState.plan === "monthly"
                            ? "$299/month"
                            : formState.plan === "yearly"
                            ? "$2,990/year"
                            : "Contact Sales"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Register and Proceed to Payment"}
                  </Button>
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

export default OrganizationRegister;
