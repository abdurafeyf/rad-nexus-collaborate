
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO, isToday, isPast } from "date-fns";
import { Appointment } from "@/hooks/useAppointments";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
  userType: 'doctor' | 'patient';
  onStatusChange: (id: string, status: 'completed' | 'cancelled') => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ 
  appointments, 
  isLoading, 
  userType,
  onStatusChange
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderAppointments = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 border-4 border-t-teal-500 border-teal-200 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="text-center p-8 text-gray-500">
          No appointments found.
        </div>
      );
    }

    return appointments.map((appointment) => {
      const appointmentDate = parseISO(appointment.appointment_date);
      const isPastAppointment = isPast(appointmentDate) && !isToday(appointmentDate);
      
      return (
        <Card key={appointment.id} className="mb-4 overflow-hidden">
          <div className={`h-1 ${getStatusColor(appointment.status).split(' ')[0]}`}></div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">{appointment.title}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{format(appointmentDate, 'MMM dd, yyyy')}</span>
                  <Clock className="h-4 w-4 ml-3 mr-1" />
                  <span>{format(appointmentDate, 'h:mm a')}</span>
                </div>
                
                {appointment.location && (
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{appointment.location}</span>
                  </div>
                )}
                
                {userType === 'doctor' && appointment.patient_name && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Patient:</span> <span className="font-medium">{appointment.patient_name}</span>
                  </div>
                )}
                
                {userType === 'patient' && appointment.doctor_name && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Doctor:</span> <span className="font-medium">{appointment.doctor_name}</span>
                  </div>
                )}
                
                {appointment.description && (
                  <div className="mt-2 text-sm text-gray-600">
                    {appointment.description}
                  </div>
                )}
              </div>
              
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>
            
            {appointment.status === 'scheduled' && !isPastAppointment && (
              <div className="mt-4 flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onStatusChange(appointment.id, 'cancelled')}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onStatusChange(appointment.id, 'completed')}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {userType === 'doctor' ? 'Patient Appointments' : 'Your Appointments'}
        </CardTitle>
      </CardHeader>
      <ScrollArea className="h-[500px]">
        <CardContent>
          {renderAppointments()}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default AppointmentList;
