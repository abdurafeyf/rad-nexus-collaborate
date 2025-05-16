
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import NewSidebar from "@/components/NewSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle, MapPin } from "lucide-react";

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
}

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  doctor_id: string;
  patient_id: string;
  duration_minutes: number;
  status: string;
  location: string | null;
  doctor_name?: string;
  patient_name?: string;
}

const AppointmentsPage = () => {
  const { user, userType } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State for appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for scheduling
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDesc, setAppointmentDesc] = useState("");
  const [appointmentLocation, setAppointmentLocation] = useState("");
  
  // State for patient/doctor data
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  // Format date for display
  const formatDate = (date: string) => {
    return format(new Date(date), "PPP");
  };
  
  // Format time for display
  const formatTime = (date: string) => {
    return format(new Date(date), "h:mm a");
  };
  
  // Get styled badge for appointment status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'scheduled':
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
      case 'completed':
        return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium";
      case 'cancelled':
        return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
      case 'pending_doctor':
        return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium";
      case 'pending_patient':
        return "bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium";
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
    }
  };
  
  // Get friendly name for appointment status
  const getStatusName = (status: string) => {
    switch(status) {
      case 'scheduled':
        return "Confirmed";
      case 'completed':
        return "Completed";
      case 'cancelled':
        return "Cancelled";
      case 'pending_doctor':
        return "Awaiting Doctor";
      case 'pending_patient':
        return "Awaiting Patient";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Fetch patient or doctor information
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        if (userType === 'patient') {
          // Fetch patient information
          const { data, error } = await supabase
            .from("patients")
            .select("*")
            .eq("email", user.email)
            .maybeSingle();
            
          if (error && !error.message.includes("No rows found")) throw error;
          
          if (data) {
            console.log("Patient info:", data);
            setPatientInfo(data);
            
            // Fetch available doctors
            await fetchAvailableDoctors();
          }
        }
      } catch (error: any) {
        console.error("Error fetching user info:", error);
        toast({
          title: "Error",
          description: "Failed to load your information",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserInfo();
  }, [user, userType, toast]);
  
  // Fetch available doctors for patients
  const fetchAvailableDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, first_name, last_name, specialization");
        
      if (error) throw error;
      
      console.log("Available doctors:", data);
      setDoctors(data || []);
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Error",
        description: "Failed to load available doctors",
        variant: "destructive"
      });
    }
  };
  
  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    if (!user || (!patientInfo && userType === "patient")) return;
    
    try {
      setIsLoading(true);
      
      let query: any;
      
      if (userType === 'doctor') {
        // Get doctor ID from user ID
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (doctorError && !doctorError.message.includes("No rows found")) throw doctorError;
        
        if (!doctorData) {
          console.error("No doctor record found for this user");
          return;
        }
        
        query = supabase
          .from("appointments")
          .select(`
            *,
            patients:patient_id (name)
          `)
          .eq("doctor_id", doctorData.id)
          .order("appointment_date", { ascending: true });
      } else if (userType === 'patient' && patientInfo) {
        query = supabase
          .from("appointments")
          .select(`
            *,
            doctors:doctor_id (first_name, last_name)
          `)
          .eq("patient_id", patientInfo.id)
          .order("appointment_date", { ascending: true });
      }
      
      if (query) {
        const { data, error } = await query;
        
        if (error) throw error;
        
        console.log("Appointments:", data);
        
        // Format the appointments data
        const formattedAppointments = data.map((appointment: any) => {
          let doctorName, patientName;
          
          if (userType === 'doctor' && appointment.patients) {
            patientName = appointment.patients.name;
          } else if (userType === 'patient' && appointment.doctors) {
            doctorName = `Dr. ${appointment.doctors.first_name} ${appointment.doctors.last_name}`;
          }
          
          return {
            ...appointment,
            doctor_name: doctorName,
            patient_name: patientName
          };
        });
        
        setAppointments(formattedAppointments);
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error fetching appointments",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, userType, patientInfo, toast]);
  
  // Generate available times
  const generateAvailableTimes = () => {
    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    setAvailableTimes(times);
  };
  
  // Generate and set available times on doctor selection
  useEffect(() => {
    if (selectedDoctorId) {
      generateAvailableTimes();
    }
  }, [selectedDoctorId]);
  
  // Fetch appointments on component mount
  useEffect(() => {
    if ((userType === "doctor" && user) || (userType === "patient" && patientInfo)) {
      fetchAppointments();
    }
  }, [userType, user, patientInfo, fetchAppointments]);
  
  // Request appointment
  const handleRequestAppointment = async () => {
    if (!patientInfo || !selectedDoctorId || !selectedDate || !selectedTime || !appointmentTitle) {
      toast({
        title: "Required Information Missing",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create appointment date from selected date and time
      const [hour, minute] = selectedTime.split(':').map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hour, minute, 0, 0);
      
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: patientInfo.id,
          doctor_id: selectedDoctorId,
          title: appointmentTitle,
          description: appointmentDesc,
          appointment_date: appointmentDate.toISOString(),
          duration_minutes: 30,
          location: appointmentLocation,
          status: "pending_doctor"
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Appointment Requested",
        description: "Your appointment request has been sent to the doctor",
      });
      
      // Reset form
      setSelectedDate(new Date());
      setSelectedTime("");
      setAppointmentTitle("");
      setAppointmentDesc("");
      setAppointmentLocation("");
      setSelectedDoctorId("");
      setShowSchedule(false);
      
      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      console.error("Error requesting appointment:", error);
      toast({
        title: "Error",
        description: "Failed to request appointment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId);
        
      if (error) throw error;
      
      toast({
        title: "Appointment Updated",
        description: `Appointment status updated to ${getStatusName(status).toLowerCase()}`,
      });
      
      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <NewSidebar type={userType as "doctor" | "patient"}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
            <p className="text-gray-600">Manage your appointments</p>
          </div>
          
          {userType === "patient" && (
            <Button 
              onClick={() => setShowSchedule(true)}
              className="bg-teal-500 hover:bg-teal-600"
            >
              Request Appointment
            </Button>
          )}
        </div>
        
        {/* Appointment scheduling dialog for patients */}
        <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request New Appointment</DialogTitle>
              <DialogDescription>
                Fill in the details below to request an appointment with a doctor.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="doctor">Select Doctor</Label>
                <Select 
                  value={selectedDoctorId} 
                  onValueChange={setSelectedDoctorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.length > 0 ? (
                      doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name}
                          {doctor.specialization && ` (${doctor.specialization})`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="">No doctors available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Select Time</Label>
                <Select 
                  value={selectedTime} 
                  onValueChange={setSelectedTime} 
                  disabled={!selectedDoctorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Appointment Title</Label>
                <Input
                  id="title"
                  placeholder="E.g., Annual Check-up"
                  value={appointmentTitle}
                  onChange={(e) => setAppointmentTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your reason for the appointment"
                  value={appointmentDesc}
                  onChange={(e) => setAppointmentDesc(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="E.g., Medical Center Office #302"
                  value={appointmentLocation}
                  onChange={(e) => setAppointmentLocation(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowSchedule(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRequestAppointment}
                disabled={!selectedDoctorId || !selectedDate || !selectedTime || !appointmentTitle}
              >
                Request Appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-8">
            {/* Upcoming appointments */}
            <Card className="border-0 shadow-subtle">
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments
                    .filter(app => ['scheduled', 'pending_doctor', 'pending_patient'].includes(app.status))
                    .filter(app => new Date(app.appointment_date) >= new Date())
                    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
                    .map(appointment => (
                      <div key={appointment.id} className="flex flex-col md:flex-row justify-between border rounded-lg p-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-lg">{appointment.title}</h3>
                            <span className={getStatusBadge(appointment.status)}>
                              {getStatusName(appointment.status)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                              {formatDate(appointment.appointment_date)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-gray-400" />
                              {formatTime(appointment.appointment_date)}
                            </div>
                            {userType === "doctor" ? (
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                {appointment.patient_name || "Unknown Patient"}
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                {appointment.doctor_name || "Unknown Doctor"}
                              </div>
                            )}
                            {appointment.location && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                {appointment.location}
                              </div>
                            )}
                          </div>
                          
                          {appointment.description && (
                            <p className="text-sm text-gray-600 mt-1">{appointment.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-4 md:mt-0 space-x-3">
                          {userType === "doctor" && appointment.status === "pending_doctor" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                                onClick={() => updateAppointmentStatus(appointment.id, "scheduled")}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                          
                          {userType === "patient" && appointment.status === "scheduled" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  
                  {appointments.filter(app => 
                    ['scheduled', 'pending_doctor', 'pending_patient'].includes(app.status) && 
                    new Date(app.appointment_date) >= new Date()
                  ).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No upcoming appointments
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Past appointments */}
            <Card className="border-0 shadow-subtle">
              <CardHeader>
                <CardTitle>Past Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments
                    .filter(app => 
                      app.status === "completed" || 
                      (app.status === "scheduled" && new Date(app.appointment_date) < new Date())
                    )
                    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
                    .slice(0, 5) // Only show the 5 most recent past appointments
                    .map(appointment => (
                      <div key={appointment.id} className="flex flex-col md:flex-row justify-between border rounded-lg p-4 bg-gray-50">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{appointment.title}</h3>
                            <span className={getStatusBadge(appointment.status)}>
                              {getStatusName(appointment.status)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                              {formatDate(appointment.appointment_date)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-gray-400" />
                              {formatTime(appointment.appointment_date)}
                            </div>
                            {userType === "doctor" ? (
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                {appointment.patient_name || "Unknown Patient"}
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                {appointment.doctor_name || "Unknown Doctor"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {appointments.filter(app => 
                    app.status === "completed" || 
                    (app.status === "scheduled" && new Date(app.appointment_date) < new Date())
                  ).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No past appointments
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-0 shadow-subtle">
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No appointments found</p>
              {userType === "patient" && (
                <Button 
                  onClick={() => setShowSchedule(true)} 
                  className="mt-4 bg-teal-500 hover:bg-teal-600"
                >
                  Request your first appointment
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </NewSidebar>
  );
};

export default AppointmentsPage;
