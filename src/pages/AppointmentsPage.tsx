
import React, { useState } from "react";
import NewSidebar from "@/components/NewSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<{id: string, name: string}[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDescription, setAppointmentDescription] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const { toast } = useToast();
  
  const userType = user?.user_metadata?.user_type || "patient";

  React.useEffect(() => {
    fetchAppointments();
    if (userType === "patient") {
      fetchDoctors();
    }
  }, [userType]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      let query;
      
      if (userType === "doctor") {
        // Get doctor ID from user metadata
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("id")
          .eq("email", user.email)
          .single();
        
        if (doctorError) throw doctorError;
        
        query = supabase
          .from("appointments")
          .select(`
            *,
            patients:patient_id (name)
          `)
          .eq("doctor_id", doctorData.id)
          .order("appointment_date", { ascending: true });
      } else {
        // Get patient ID from email
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("id")
          .eq("email", user.email)
          .single();
        
        if (patientError) throw patientError;
        
        query = supabase
          .from("appointments")
          .select(`
            *,
            doctors:doctor_id (first_name, last_name)
          `)
          .eq("patient_id", patientData.id)
          .order("appointment_date", { ascending: true });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      setAppointments(data);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, first_name, last_name");
        
      if (error) throw error;
      
      setDoctors(data.map((doc) => ({
        id: doc.id,
        name: `${doc.first_name} ${doc.last_name}`
      })));
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const requestAppointment = async () => {
    try {
      if (!user?.email) {
        toast({
          title: "Error",
          description: "You must be logged in to request an appointment",
          variant: "destructive"
        });
        return;
      }
      
      if (!selectedDoctor || !appointmentTitle || !appointmentTime || !selectedDate) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }
      
      setIsLoading(true);
      
      // Get patient ID from email
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("email", user.email)
        .single();
      
      if (patientError) throw patientError;
      
      // Create date object from selected date and time
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      const appointmentDatetime = new Date(selectedDate);
      appointmentDatetime.setHours(hours, minutes, 0, 0);
      
      // Create appointment
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: patientData.id,
          doctor_id: selectedDoctor,
          title: appointmentTitle,
          description: appointmentDescription,
          appointment_date: appointmentDatetime.toISOString(),
          status: "pending_doctor"
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Appointment request submitted successfully",
      });
      
      // Reset form
      setAppointmentTitle("");
      setAppointmentDescription("");
      setAppointmentTime("");
      
      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      console.error("Error requesting appointment:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string, reason?: string) => {
    try {
      setIsLoading(true);
      
      const updateData: any = { status };
      if (reason) {
        updateData.cancellation_reason = reason;
      }
      
      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", id);
        
      if (error) throw error;
      
      toast({
        title: status === "scheduled" ? "Approved" : "Cancelled",
        description: `Appointment has been ${status === "scheduled" ? "approved" : "cancelled"}`,
      });
      
      fetchAppointments();
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAppointmentCard = (appointment: any) => {
    const appointmentDate = new Date(appointment.appointment_date);
    const doctorName = appointment.doctors 
      ? `${appointment.doctors.first_name} ${appointment.doctors.last_name}`
      : "Unknown Doctor";
    const patientName = appointment.patients?.name || "Unknown Patient";
    
    return (
      <Card key={appointment.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{appointment.title}</CardTitle>
            <div className={`px-2 py-1 text-xs rounded-full ${
              appointment.status === "scheduled" ? "bg-green-100 text-green-800" :
              appointment.status === "pending_doctor" ? "bg-yellow-100 text-yellow-800" :
              appointment.status === "cancelled" ? "bg-red-100 text-red-800" :
              "bg-blue-100 text-blue-800"
            }`}>
              {appointment.status === "pending_doctor" ? "Awaiting Approval" : 
               appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>{format(appointmentDate, "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>{format(appointmentDate, "h:mm a")}</span>
              </div>
              <div className="text-sm text-gray-600">
                {userType === "doctor" ? `Patient: ${patientName}` : `Doctor: ${doctorName}`}
              </div>
              {appointment.description && (
                <p className="text-sm text-gray-600 mt-2">{appointment.description}</p>
              )}
              {appointment.cancellation_reason && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-100">
                  Reason for cancellation: {appointment.cancellation_reason}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            {userType === "doctor" && appointment.status === "pending_doctor" && (
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                  onClick={() => updateAppointmentStatus(appointment.id, "scheduled")}
                >
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                  onClick={() => {
                    const reason = prompt("Reason for declining?");
                    if (reason !== null) {
                      updateAppointmentStatus(appointment.id, "cancelled", reason);
                    }
                  }}
                >
                  Decline
                </Button>
              </div>
            )}
            
            {appointment.status === "scheduled" && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                onClick={() => {
                  const reason = prompt("Reason for cancellation?");
                  if (reason !== null) {
                    updateAppointmentStatus(appointment.id, "cancelled", reason);
                  }
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <NewSidebar type={userType}>
      <div className="container py-8 px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Appointments</h1>
        
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="upcoming">My Appointments</TabsTrigger>
            {userType === "patient" && (
              <TabsTrigger value="request">Request Appointment</TabsTrigger>
            )}
            {userType === "doctor" && (
              <TabsTrigger value="pending">Pending Requests</TabsTrigger>
            )}
          </TabsList>
          
          {/* Upcoming appointments tab */}
          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {isLoading ? (
                <div className="flex justify-center p-12">
                  <div className="h-8 w-8 border-4 border-t-teal-500 border-teal-200 rounded-full animate-spin"></div>
                </div>
              ) : appointments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="font-medium text-lg mb-2">No appointments found</h3>
                    <p className="text-gray-500">
                      {userType === "patient" 
                        ? "You don't have any appointments. Request one from the Request Appointment tab."
                        : "You don't have any upcoming appointments with patients."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  {appointments.filter(a => a.status !== "pending_doctor").map(renderAppointmentCard)}
                </ScrollArea>
              )}
            </div>
          </TabsContent>
          
          {/* Request appointment tab (patient only) */}
          {userType === "patient" && (
            <TabsContent value="request" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Date & Doctor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Date</label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="rounded-md border"
                        disabled={{ before: new Date() }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Doctor</label>
                      <select 
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                      >
                        <option value="">Select a doctor</option>
                        {doctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Time</label>
                      <select 
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                      >
                        <option value="">Select a time</option>
                        {Array.from({ length: 24 }).map((_, i) => {
                          const hour = i;
                          return [0, 30].map(minute => {
                            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                            const formatted = format(new Date().setHours(hour, minute), 'h:mm a');
                            return (
                              <option key={time} value={time}>{formatted}</option>
                            );
                          });
                        }).flat()}
                      </select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        placeholder="e.g., Annual Checkup"
                        value={appointmentTitle}
                        onChange={(e) => setAppointmentTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description (Optional)</label>
                      <Textarea
                        placeholder="Brief description of your appointment reason"
                        value={appointmentDescription}
                        onChange={(e) => setAppointmentDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                    
                    <Button 
                      onClick={requestAppointment} 
                      className="w-full"
                      disabled={isLoading || !selectedDoctor || !appointmentTitle || !appointmentTime}
                    >
                      {isLoading ? (
                        <>
                          <span className="mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Request Appointment"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
          
          {/* Pending requests tab (doctor only) */}
          {userType === "doctor" && (
            <TabsContent value="pending" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {isLoading ? (
                  <div className="flex justify-center p-12">
                    <div className="h-8 w-8 border-4 border-t-teal-500 border-teal-200 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-medium text-lg">Appointment Requests</h2>
                    {appointments.filter(a => a.status === "pending_doctor").length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                          <CalendarIcon className="h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="font-medium text-lg mb-2">No pending requests</h3>
                          <p className="text-gray-500">You don't have any pending appointment requests from patients.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <ScrollArea className="h-[600px] pr-4">
                        {appointments.filter(a => a.status === "pending_doctor").map(renderAppointmentCard)}
                      </ScrollArea>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </NewSidebar>
  );
};

export default AppointmentsPage;
