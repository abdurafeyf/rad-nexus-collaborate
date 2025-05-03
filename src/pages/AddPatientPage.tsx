
import React, { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PlusCircle, Trash, Calendar, Mail, User } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import NewSidebar from "@/components/NewSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { createPatientAuth, generateTemporaryPassword, sendPatientWelcomeEmail } from "@/utils/passwordUtils";

// Form schema for patient creation
const patientFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  dateOfBirth: z.date().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  notes: z.string().optional(),
  xrays: z
    .array(
      z.object({
        date: z.date(),
        file: z.instanceof(File).optional(),
      })
    )
    .optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const AddPatientPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  
  React.useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", user.id)
          .single();
          
        if (error) throw error;
        
        setCurrentDoctorId(data.id);
      } catch (error: any) {
        console.error("Error fetching doctor info:", error);
        toast({
          title: "Error",
          description: "Could not fetch doctor information.",
          variant: "destructive",
        });
      }
    };
    
    fetchDoctorInfo();
  }, [user, toast]);
  
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      notes: "",
      xrays: [],
    },
  });

  // Add new X-ray field
  const addXray = () => {
    const currentXrays = form.getValues("xrays") || [];
    form.setValue("xrays", [
      ...currentXrays,
      { date: new Date(), file: undefined },
    ]);
  };

  // Remove X-ray field
  const removeXray = (index: number) => {
    const currentXrays = form.getValues("xrays") || [];
    const newXrays = [...currentXrays];
    newXrays.splice(index, 1);
    form.setValue("xrays", newXrays);
  };

  const onSubmit = async (data: PatientFormValues) => {
    if (!currentDoctorId) {
      toast({
        title: "Error",
        description: "Doctor information is not available. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if patient already exists
      const { data: existingPatient, error: checkError } = await supabase
        .from("patients")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      let patientId;
      let isNewPatient = !existingPatient;
      let temporaryPassword;

      if (!existingPatient) {
        // For new patients, create a patient record directly
        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .insert({
            name: data.name,
            email: data.email,
            date_of_birth: data.dateOfBirth ? data.dateOfBirth.toISOString().split("T")[0] : null,
            gender: data.gender || null,
            notes: data.notes || null,
            doctor_id: currentDoctorId, // Associate patient with the current doctor
          })
          .select()
          .single();

        if (patientError) {
          throw patientError;
        }

        patientId = patient.id;
        
        // Generate a secure temporary password
        temporaryPassword = generateTemporaryPassword(12);
        
        // Create auth account for the patient
        const authResult = await createPatientAuth({
          email: data.email,
          password: temporaryPassword,
        });
        
        if (!authResult.success) {
          console.warn("Failed to create auth account for patient, but patient record was created", authResult.error);
        }
      } else {
        patientId = existingPatient.id;
      }

      // Handle X-rays if any
      if (data.xrays && data.xrays.length > 0) {
        for (const xray of data.xrays) {
          // Insert X-ray record
          const { error: xrayError } = await supabase
            .from("x_rays")
            .insert({
              patient_id: patientId,
              date: xray.date.toISOString().split("T")[0],
            });

          if (xrayError) {
            throw xrayError;
          }
        }
      }

      // Send email to patient - but only for new patients
      if (isNewPatient && temporaryPassword) {
        try {
          await sendPatientWelcomeEmail(data.email, data.name, temporaryPassword);
          
          toast({
            title: "Email sent",
            description: "Welcome email with login details has been sent to the patient.",
          });
        } catch (emailError) {
          console.error("Failed to send email, but patient was added successfully:", emailError);
          
          toast({
            title: "Patient added",
            description: "Patient was added but welcome email could not be sent. Please check your email configuration.",
            // Change from "warning" to "destructive" to fix the TypeScript error
            variant: "destructive",
          });
        }
      }

      toast({
        title: isNewPatient ? "Patient added successfully" : "Patient information updated",
        description: isNewPatient 
          ? "The patient has been added and will receive login details."
          : "The patient has been updated with new information.",
      });

      // Reset the form
      form.reset();
      
      // Navigate back to dashboard
      navigate("/doctor/dashboard");
    } catch (error: any) {
      toast({
        title: "Error adding patient",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <NewSidebar type="doctor">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add New Patient</h1>
                <p className="text-sm text-gray-600">
                  Enter patient details below to add them to your dashboard
                </p>
              </div>
              <Button
                onClick={() => navigate("/doctor/dashboard")}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                    <User className="mr-2 h-5 w-5 text-teal-500" />
                    Personal Information
                  </h3>
                  
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John Doe" 
                              {...field}
                              className="border-gray-200 focus:border-teal-500 focus:ring-teal-500" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="patient@example.com"
                                type="email"
                                className="pl-10 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-gray-700">Date of Birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal border-gray-200",
                                      !field.value && "text-gray-400"
                                    )}
                                  >
                                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Gender</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-200 focus:ring-teal-500">
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Additional Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Medical Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any important notes about the patient's medical history..."
                            className="min-h-[100px] border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">X-ray Records</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addXray}
                      className="border-teal-200 hover:bg-teal-50 text-teal-600"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add X-ray
                    </Button>
                  </div>

                  {form.watch("xrays")?.length ? (
                    <div className="space-y-4">
                      {form.watch("xrays")?.map((xray, index) => (
                        <div
                          key={index}
                          className="rounded-md border border-gray-200 p-4 bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-700">X-ray #{index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeXray(index)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="mt-3">
                            <FormField
                              control={form.control}
                              name={`xrays.${index}.date`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel className="text-gray-700">Date Taken</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal border-gray-200",
                                            !field.value && "text-gray-400"
                                          )}
                                        >
                                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date > new Date()}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No X-ray records added yet</p>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={addXray}
                        className="mt-2 text-teal-600 hover:text-teal-700"
                      >
                        Add your first X-ray record
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/doctor/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !currentDoctorId}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    {isSubmitting ? "Adding Patient..." : "Add Patient & Send Login Details"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </NewSidebar>
  );
};

export default AddPatientPage;
