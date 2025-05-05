
import { useState, useEffect } from "react";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId, getDoctorIdFromUserId } from "@/integrations/supabase/client";

export interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  location: string | null;
  patient_id: string;
  doctor_id: string;
  patient_name?: string;
  doctor_name?: string;
  reminder_sent: boolean;
  created_at: string;
  cancellation_reason?: string | null;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

export const useAppointments = (userType: 'doctor' | 'patient') => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [doctors, setDoctors] = useState<{id: string, name: string}[]>([]);
  const { toast } = useToast();

  // Fetch appointments for the current user
  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      let query;

      if (userType === 'doctor') {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error("No authenticated user found");
        
        const doctorId = await getDoctorIdFromUserId(userId);
        if (!doctorId) throw new Error("Doctor record not found");
        
        query = supabase
          .from("appointments")
          .select(`
            *,
            patients:patient_id (name)
          `)
          .eq("doctor_id", doctorId)
          .order("appointment_date", { ascending: true });
      } else {
        // For patients
        const { data: currentUserEmail } = await supabase.auth.getUser();
        if (!currentUserEmail.user?.email) throw new Error("No authenticated user found");
        
        // Get patient ID from email
        const { data: patientData } = await supabase
          .from("patients")
          .select("id")
          .eq("email", currentUserEmail.user.email)
          .single();
        
        if (!patientData) throw new Error("Patient record not found");
        
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
      
      // Format the appointments data
      const formattedAppointments = data.map((appointment: any) => {
        let doctorName, patientName;
        
        if (userType === 'doctor' && appointment.patients) {
          patientName = appointment.patients.name;
        } else if (userType === 'patient' && appointment.doctors) {
          doctorName = `${appointment.doctors.first_name} ${appointment.doctors.last_name}`;
        }
        
        return {
          ...appointment,
          doctor_name: doctorName,
          patient_name: patientName
        };
      });
      
      setAppointments(formattedAppointments);
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
  };

  // Fetch available doctors (for patients)
  const fetchDoctors = async () => {
    if (userType !== 'patient') return;
    
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, first_name, last_name");
        
      if (error) throw error;
      
      setDoctors(data.map((doc) => ({
        id: doc.id,
        name: `${doc.first_name} ${doc.last_name}`
      })));
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Check available time slots for a specific doctor on a specific date
  const fetchAvailableTimeSlots = async (doctorId: string, date: Date) => {
    try {
      setIsLoading(true);
      const dayOfWeek = date.getDay();
      const formattedDate = format(date, "yyyy-MM-dd");
      
      // First get doctor's available hours for this day of week
      const { data: availabilityData, error: availabilityError } = await supabase
        .from("doctor_availability")
        .select("start_time, end_time")
        .eq("doctor_id", doctorId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_available", true);
        
      if (availabilityError) throw availabilityError;
      
      if (!availabilityData || availabilityData.length === 0) {
        setAvailableTimeSlots([]);
        return;
      }
      
      // Generate 30 min slots from start to end time
      const slots: TimeSlot[] = [];
      
      // For simplicity, use just the first availability record
      const { start_time, end_time } = availabilityData[0];
      
      // Parse the times
      const startHour = parseInt(start_time.split(':')[0]);
      const startMinute = parseInt(start_time.split(':')[1]);
      const endHour = parseInt(end_time.split(':')[0]);
      const endMinute = parseInt(end_time.split(':')[1]);
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const dateTimeString = `${formattedDate}T${timeString}:00`;
        
        // Check if this time slot conflicts with existing appointments
        const { data: isAvailable, error: checkError } = await supabase.rpc(
          "is_time_slot_available",
          {
            p_doctor_id: doctorId,
            p_start_time: dateTimeString,
            p_duration_minutes: 30
          }
        );
        
        if (checkError) throw checkError;
        
        slots.push({
          time: timeString,
          isAvailable: isAvailable
        });
        
        // Increment by 30 minutes
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }
      
      setAvailableTimeSlots(slots);
    } catch (error: any) {
      console.error("Error fetching time slots:", error);
      toast({
        title: "Error checking availability",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule a new appointment
  const scheduleAppointment = async (
    doctorId: string, 
    patientId: string,
    title: string,
    description: string,
    appointmentDate: Date,
    duration: number = 30,
    location?: string
  ) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          doctor_id: doctorId,
          patient_id: patientId,
          title,
          description,
          appointment_date: appointmentDate.toISOString(),
          duration_minutes: duration,
          location,
          status: 'scheduled'
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Appointment scheduled",
        description: "Your appointment has been successfully scheduled.",
      });
      
      // Refresh the appointments list
      fetchAppointments();
      return data;
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      toast({
        title: "Error scheduling appointment",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an appointment status (complete, cancel, reschedule)
  const updateAppointmentStatus = async (
    appointmentId: string, 
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled',
    reason?: string
  ) => {
    try {
      setIsLoading(true);
      
      const updateData: any = { status };
      if (reason) {
        updateData.cancellation_reason = reason;
      }
      
      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);
        
      if (error) throw error;
      
      toast({
        title: `Appointment ${status}`,
        description: `The appointment has been ${status}.`,
      });
      
      // Refresh the appointments list
      fetchAppointments();
      return true;
    } catch (error: any) {
      console.error(`Error updating appointment to ${status}:`, error);
      toast({
        title: "Error updating appointment",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Set doctor availability
  const setDoctorAvailability = async (
    doctorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    isAvailable: boolean = true
  ) => {
    try {
      setIsLoading(true);
      
      // Check if a record already exists
      const { data: existingData, error: checkError } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("day_of_week", dayOfWeek);
        
      if (checkError) throw checkError;
      
      let error;
      
      if (existingData && existingData.length > 0) {
        // Update existing availability
        const { error: updateError } = await supabase
          .from("doctor_availability")
          .update({
            start_time: startTime,
            end_time: endTime,
            is_available: isAvailable,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingData[0].id);
          
        error = updateError;
      } else {
        // Insert new availability
        const { error: insertError } = await supabase
          .from("doctor_availability")
          .insert({
            doctor_id: doctorId,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            is_available: isAvailable
          });
          
        error = insertError;
      }
      
      if (error) throw error;
      
      toast({
        title: "Availability updated",
        description: "Your availability settings have been updated.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error setting doctor availability:", error);
      toast({
        title: "Error updating availability",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAppointments();
    if (userType === 'patient') {
      fetchDoctors();
    }
  }, [userType]);

  return {
    appointments,
    isLoading,
    selectedDate,
    setSelectedDate,
    availableTimeSlots,
    doctors,
    fetchAvailableTimeSlots,
    scheduleAppointment,
    updateAppointmentStatus,
    setDoctorAvailability,
    refreshAppointments: fetchAppointments
  };
};
