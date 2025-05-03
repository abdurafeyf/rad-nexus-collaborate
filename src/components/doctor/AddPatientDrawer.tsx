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
import { createPatient } from "@/services/patientService";

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
      // Use the patientService to create or update the patient
      const result = await createPatient({
        name: data.name,
        email: data.email,
        doctorId,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        notes: data.notes,
        xrays: data.xrays?.map(xray => ({
          date: xray.date,
          scanType: "X-Ray" // Default to X-Ray in drawer
        }))
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: result.isNewPatient ? "Patient added successfully" : "Patient information updated",
        description: result.isNewPatient 
          ? "The patient has been added and will receive a notification when they sign up."
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
