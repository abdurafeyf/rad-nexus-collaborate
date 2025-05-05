
import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';

interface AppointmentCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ 
  onDateSelect, 
  selectedDate 
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Select Date</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          className="rounded-md border"
          disabled={{ before: new Date() }}
        />
        <div className="mt-4 text-sm text-center">
          Selected: <span className="font-medium">{format(selectedDate, 'MMM dd, yyyy')}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCalendar;
