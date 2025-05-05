
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from 'date-fns';
import { TimeSlot } from "@/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AppointmentFormProps {
  userType: 'doctor' | 'patient';
  selectedDate: Date;
  doctorId?: string;
  doctorsList?: { id: string; name: string }[];
  availableTimeSlots: TimeSlot[];
  isLoadingTimeSlots: boolean;
  onDoctorSelect?: (doctorId: string) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    patientId: string;
    doctorId: string;
    appointmentTime: Date;
    location?: string;
    requesterType: 'doctor' | 'patient';
  }) => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  userType,
  selectedDate,
  doctorId,
  doctorsList,
  availableTimeSlots,
  isLoadingTimeSlots,
  onDoctorSelect,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch patients for doctor
  useEffect(() => {
    const fetchPatients = async () => {
      if (userType !== 'doctor' || !doctorId) return;
      
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("id, name")
          .eq("doctor_id", doctorId);
          
        if (error) throw error;
        
        setPatients(data);
      } catch (error: any) {
        console.error("Error fetching patients:", error);
        toast({
          title: "Error fetching patients",
          description: error.message,
          variant: "destructive"
        });
      }
    };
    
    fetchPatients();
  }, [userType, doctorId, toast]);

  const handleDoctorChange = (value: string) => {
    setSelectedDoctorId(value);
    setSelectedTimeSlot('');
    if (onDoctorSelect) {
      onDoctorSelect(value);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      if (!title) {
        toast({
          title: "Missing information",
          description: "Please enter an appointment title",
          variant: "destructive"
        });
        return;
      }
      
      if (!selectedTimeSlot) {
        toast({
          title: "Missing information",
          description: "Please select an appointment time",
          variant: "destructive"
        });
        return;
      }
      
      if (userType === 'doctor' && !selectedPatientId) {
        toast({
          title: "Missing information",
          description: "Please select a patient",
          variant: "destructive"
        });
        return;
      }
      
      if (userType === 'patient' && !selectedDoctorId) {
        toast({
          title: "Missing information",
          description: "Please select a doctor",
          variant: "destructive"
        });
        return;
      }
      
      // Create appointment date from selected date and time slot
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      const appointmentTime = new Date(selectedDate);
      appointmentTime.setHours(hours, minutes, 0, 0);
      
      let patientId = selectedPatientId;
      let finalDoctorId = selectedDoctorId;
      
      // If patient is scheduling, we need to get their ID
      if (userType === 'patient') {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user?.email) {
          toast({
            title: "Authentication error",
            description: "Could not determine your user account",
            variant: "destructive"
          });
          return;
        }
        
        const { data: patientData, error } = await supabase
          .from("patients")
          .select("id")
          .eq("email", userData.user.email)
          .single();
          
        if (error || !patientData) {
          toast({
            title: "Error",
            description: "Could not find your patient record",
            variant: "destructive"
          });
          return;
        }
        
        patientId = patientData.id;
      }
      
      // If doctor is scheduling, we need their ID
      if (userType === 'doctor') {
        finalDoctorId = doctorId || '';
      }
      
      onSubmit({
        title,
        description,
        patientId,
        doctorId: finalDoctorId,
        appointmentTime,
        location,
        requesterType: userType
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setSelectedTimeSlot('');
      if (userType === 'doctor') {
        setSelectedPatientId('');
      }
    } catch (error: any) {
      console.error("Error handling appointment form submission:", error);
      toast({
        title: "Error scheduling appointment",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {userType === 'doctor' 
            ? 'Schedule Patient Appointment' 
            : 'Request Appointment with Doctor'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-medium">
            Appointment Title
          </label>
          <Input
            id="title"
            placeholder="e.g., Follow-up Consultation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Details about the appointment..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        {/* Location */}
        <div className="space-y-1">
          <label htmlFor="location" className="text-sm font-medium">
            Location (optional)
          </label>
          <Input
            id="location"
            placeholder="e.g., Radiology Department, Room 103"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        
        {/* Date display */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Date</label>
          <div className="p-2 border rounded-md bg-gray-50">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
        
        {/* Doctor selection (for patients) */}
        {userType === 'patient' && doctorsList && (
          <div className="space-y-1">
            <label htmlFor="doctor" className="text-sm font-medium">
              Select Doctor
            </label>
            <Select 
              value={selectedDoctorId} 
              onValueChange={handleDoctorChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctorsList.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Patient selection (for doctors) */}
        {userType === 'doctor' && (
          <div className="space-y-1">
            <label htmlFor="patient" className="text-sm font-medium">
              Select Patient
            </label>
            <Select 
              value={selectedPatientId} 
              onValueChange={setSelectedPatientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Time slot selection */}
        <div className="space-y-1">
          <label htmlFor="time" className="text-sm font-medium">
            Available Time Slots
          </label>
          
          {isLoadingTimeSlots ? (
            <div className="flex justify-center p-4">
              <div className="h-6 w-6 border-2 border-t-teal-500 border-teal-200 rounded-full animate-spin"></div>
            </div>
          ) : availableTimeSlots.length === 0 ? (
            <div className="p-4 text-center text-gray-500 border rounded-md bg-gray-50">
              {selectedDoctorId ? 
                "No available time slots on this date." : 
                userType === 'patient' ? "Please select a doctor first." : "No available time slots."}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableTimeSlots.map((slot, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                  disabled={!slot.isAvailable}
                  onClick={() => setSelectedTimeSlot(slot.time)}
                  className={!slot.isAvailable ? "bg-gray-100 text-gray-400" : ""}
                >
                  {slot.time}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Submit button */}
        <Button 
          onClick={handleSubmit} 
          className="w-full bg-teal-500 hover:bg-teal-600"
          disabled={
            isLoading || 
            !title || 
            !selectedTimeSlot || 
            (userType === 'doctor' && !selectedPatientId) || 
            (userType === 'patient' && !selectedDoctorId)
          }
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            userType === 'doctor' ? 'Schedule Appointment' : 'Request Appointment'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AppointmentForm;
