
import React, { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PlusCircle, Trash } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";

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

interface AddPatientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientAdded: () => void;
  doctorId?: string;
}

// Generate a random password of specified length
const generateTemporaryPassword = (length = 10) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Send email to patient
const sendPatientEmail = async (
  patientEmail: string, 
  patientName: string, 
  isNewPatient: boolean, 
  temporaryPassword?: string
) => {
  try {
    let subject, html;
    
    if (isNewPatient) {
      subject = "Welcome to RaDixpert - Your Patient Account";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #10b981; margin-bottom: 5px;">RaDixpert</h1>
            <p style="color: #64748b; font-size: 16px;">Your Radiology Expert</p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #334155; margin-bottom: 16px;">Welcome, ${patientName}!</h2>
            <p style="color: #475569; line-height: 1.6;">Your healthcare provider has created an account for you in the RaDixpert system. You can now access your medical reports and chat with your doctors.</p>
            <p style="color: #475569; line-height: 1.6; margin-top: 16px;">Your temporary login details:</p>
            <div style="background-color: #e2e8f0; padding: 12px; border-radius: 4px; margin: 16px 0;">
              <p style="margin: 4px 0; font-family: monospace; font-size: 16px;">Email: ${patientEmail}</p>
              <p style="margin: 4px 0; font-family: monospace; font-size: 16px;">Temporary Password: ${temporaryPassword}</p>
            </div>
            <p style="color: #475569; line-height: 1.6;">You'll be asked to change your password when you first log in.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://radixpert.com/login/patient" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Your Account</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 14px;">
            <p>If you have any questions, please contact your healthcare provider.</p>
            <p>&copy; ${new Date().getFullYear()} RaDixpert. All rights reserved.</p>
          </div>
        </div>
      `;
    } else {
      subject = "RaDixpert - New Medical Information Available";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #10b981; margin-bottom: 5px;">RaDixpert</h1>
            <p style="color: #64748b; font-size: 16px;">Your Radiology Expert</p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #334155; margin-bottom: 16px;">Hello, ${patientName}!</h2>
            <p style="color: #475569; line-height: 1.6;">Your healthcare provider has added new medical information to your RaDixpert account. Please log in to your patient portal to view the updates.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://radixpert.com/login/patient" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Portal</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 14px;">
            <p>If you have any questions, please contact your healthcare provider.</p>
            <p>&copy; ${new Date().getFullYear()} RaDixpert. All rights reserved.</p>
          </div>
        </div>
      `;
    }

    // Call the send-email function
    const response = await fetch(`https://ruueewpswsmmagpsxbvk.supabase.co/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: patientEmail,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send email");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const createPatientAuthAccount = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating patient auth account:", error);
    throw error;
  }
};

const AddPatientDrawer: React.FC<AddPatientDrawerProps> = ({
  open,
  onOpenChange,
  onPatientAdded,
  doctorId,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      notes: "",
      xrays: [],
    },
  });
  
  const { fields, append, remove } = form.control._formValues.xrays || [];

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
    if (!doctorId) {
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
        .single();

      let patientId;
      let isNewPatient = !existingPatient;
      let temporaryPassword;

      if (!existingPatient) {
        // Generate temporary password for new patient
        temporaryPassword = generateTemporaryPassword();
        
        try {
          // Create auth account for the patient
          await createPatientAuthAccount(data.email, temporaryPassword);
        } catch (authError: any) {
          // If auth account already exists, proceed with patient registration
          if (!authError.message?.includes("User already registered")) {
            throw authError;
          }
        }

        // Insert patient data
        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .insert({
            name: data.name,
            email: data.email,
            date_of_birth: data.dateOfBirth ? data.dateOfBirth.toISOString().split("T")[0] : null,
            gender: data.gender || null,
            notes: data.notes || null,
            doctor_id: doctorId, // Associate patient with the current doctor
          })
          .select()
          .single();

        if (patientError) {
          throw patientError;
        }

        patientId = patient.id;
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

          // TODO: Handle file upload if needed
        }
      }

      // Send email to patient
      await sendPatientEmail(data.email, data.name, isNewPatient, temporaryPassword);

      toast({
        title: isNewPatient ? "Patient added successfully" : "Patient information updated",
        description: isNewPatient 
          ? "The patient has been added and received login instructions."
          : "The patient has been notified of the new information.",
      });

      // Reset the form
      form.reset();
      
      // Notify parent component
      onPatientAdded();
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Add New Patient</DrawerTitle>
          <DrawerDescription>
            Fill out the form below to add a new patient to your dashboard.
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="patient@example.com"
                        type="email"
                        {...field}
                      />
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
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span className="text-muted-foreground">
                                  Pick a date
                                </span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
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
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any important notes about the patient..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">X-ray Records</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addXray}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add X-ray
                  </Button>
                </div>

                {form.watch("xrays")?.map((xray, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">X-ray #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeXray(index)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    <div className="mt-3 space-y-4">
                      <FormField
                        control={form.control}
                        name={`xrays.${index}.date`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className="w-full pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span className="text-muted-foreground">
                                        Pick a date
                                      </span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
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
                      
                      {/* File upload can be added here if needed */}
                    </div>
                  </div>
                ))}
              </div>

              <DrawerFooter className="px-0">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !doctorId}
                >
                  {isSubmitting ? "Adding..." : "Add Patient"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddPatientDrawer;
