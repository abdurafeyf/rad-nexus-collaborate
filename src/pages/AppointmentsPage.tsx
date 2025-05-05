
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import NewSidebar from "@/components/NewSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useAppointments } from "@/hooks/useAppointments";
import AppointmentCalendar from "@/components/appointments/AppointmentCalendar";
import AppointmentList from "@/components/appointments/AppointmentList";
import AppointmentForm from "@/components/appointments/AppointmentForm";
import DoctorAvailabilitySettings from "@/components/appointments/DoctorAvailabilitySettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDoctorIdFromUserId } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

const AppointmentsPage: React.FC = () => {
  const { userType } = useParams<{ userType: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [doctorId, setDoctorId] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  
  const {
    appointments,
    isLoading,
    selectedDate,
    setSelectedDate,
    availableTimeSlots,
    availableDates,
    doctors,
    fetchAvailableTimeSlots,
    fetchAvailableDaysForDoctor,
    scheduleAppointment,
    updateAppointmentStatus,
    refreshAppointments
  } = useAppointments(userType as 'doctor' | 'patient');

  // Get doctor ID for the current user if doctor
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (userType !== 'doctor' || !user?.id) return;
      
      try {
        const docId = await getDoctorIdFromUserId(user.id);
        if (docId) {
          setDoctorId(docId);
        }
      } catch (error) {
        console.error("Error fetching doctor ID:", error);
      }
    };
    
    fetchDoctorId();
  }, [userType, user]);

  // Handle doctor selection for availability checking
  const handleDoctorSelect = (selectedDoctorId: string) => {
    fetchAvailableTimeSlots(selectedDoctorId, selectedDate);
    fetchAvailableDaysForDoctor(selectedDoctorId);
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (userType === 'doctor' && doctorId) {
      fetchAvailableTimeSlots(doctorId, date);
    } else if (userType === 'patient' && activeTab === "schedule" && doctors.length > 0) {
      const selectedDoctor = document.querySelector('button[data-state="active"]')?.getAttribute('data-value');
      if (selectedDoctor) {
        fetchAvailableTimeSlots(selectedDoctor, date);
      }
    }
  };

  // Handle appointment creation
  const handleCreateAppointment = async (data: {
    title: string;
    description: string;
    patientId: string;
    doctorId: string;
    appointmentTime: Date;
    location?: string;
    requesterType: 'doctor' | 'patient';
  }) => {
    const result = await scheduleAppointment(
      data.doctorId,
      data.patientId,
      data.title,
      data.description,
      data.appointmentTime,
      30,
      data.location,
      data.requesterType
    );
    
    if (result) {
      const userText = data.requesterType === 'doctor' ? 'patient' : 'doctor';
      toast({
        title: "Appointment requested",
        description: `Your appointment has been requested and is pending approval from the ${userText}.`
      });
    }
  };

  // Handle status updates
  const handleStatusChange = async (id: string, status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'pending_doctor' | 'pending_patient', reason?: string) => {
    await updateAppointmentStatus(id, status, reason);
    refreshAppointments();
  };

  // Get pending appointment counts
  const pendingCount = appointments.filter(apt => {
    if (userType === 'doctor') {
      return apt.status === 'pending_doctor';
    } else {
      return apt.status === 'pending_patient';
    }
  }).length;

  return (
    <NewSidebar type={userType as 'doctor' | 'patient'}>
      <div className="container py-8 px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Appointments</h1>
        
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="upcoming" className="relative">
              Upcoming Appointments
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-red-500 hover:bg-red-600">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedule">
              {userType === 'doctor' ? 'Schedule Appointment' : 'Request Appointment'}
            </TabsTrigger>
            {userType === 'doctor' && (
              <TabsTrigger value="availability">Manage Availability</TabsTrigger>
            )}
          </TabsList>
          
          {/* Upcoming Appointments Tab */}
          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <AppointmentCalendar 
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                />
              </div>
              <div className="md:col-span-2">
                <AppointmentList 
                  appointments={appointments}
                  isLoading={isLoading}
                  userType={userType as 'doctor' | 'patient'}
                  onStatusChange={handleStatusChange}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Schedule Appointment Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <AppointmentCalendar 
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  availableDays={availableDates}
                />
              </div>
              <div className="md:col-span-2">
                <AppointmentForm 
                  userType={userType as 'doctor' | 'patient'}
                  selectedDate={selectedDate}
                  doctorId={doctorId}
                  doctorsList={doctors}
                  availableTimeSlots={availableTimeSlots}
                  isLoadingTimeSlots={isLoading}
                  onDoctorSelect={handleDoctorSelect}
                  onSubmit={handleCreateAppointment}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Doctor Availability Tab */}
          {userType === 'doctor' && (
            <TabsContent value="availability" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Availability Settings</CardTitle>
                      <CardDescription>
                        Set your weekly schedule to let patients know when you're available for appointments.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Setting your availability helps manage your schedule efficiently and allows patients to book appointments during your preferred hours.
                      </p>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={refreshAppointments}
                      >
                        Refresh Appointments
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <div className="md:col-span-2">
                  <DoctorAvailabilitySettings />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </NewSidebar>
  );
};

export default AppointmentsPage;
