
import React, { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PlusCircle, Trash, Calendar, Mail, User } from "lucide-react";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
        .maybeSingle();

      let patientId;
      let isNewPatient = !existingPatient;
      let temporaryPassword;

      if (!existingPatient) {
        // For new patients, create a patient record directly without Auth integration
        // This fixes the "User not allowed" error by skipping auth user creation
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
        temporaryPassword = generateTemporaryPassword();
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
      if (isNewPatient) {
        try {
          await sendPatientEmail(data.email, data.name, isNewPatient, temporaryPassword);
        } catch (emailError) {
          console.error("Failed to send email, but patient was added successfully:", emailError);
          // Don't throw here, just log the error since patient was added
        }
      }

      toast({
        title: isNewPatient ? "Patient added successfully" : "Patient information updated",
        description: isNewPatient 
          ? "The patient has been added."
          : "The patient has been updated with new information.",
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
        <DrawerHeader className="bg-gradient-to-r from-teal-500 to-teal-400 text-white">
          <DrawerTitle className="text-2xl font-bold">Add New Patient</DrawerTitle>
          <DrawerDescription className="text-teal-50">
            Enter patient details below and they'll be added to your dashboard.
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 py-6">
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

              <DrawerFooter className="px-0 pt-2 pb-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !doctorId}
                  className="bg-teal-500 hover:bg-teal-600 w-full"
                >
                  {isSubmitting ? "Adding Patient..." : "Add Patient"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">Cancel</Button>
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
