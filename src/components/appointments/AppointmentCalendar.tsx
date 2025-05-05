
import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";

interface AppointmentCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  availableDays?: Date[];
  highlightToday?: boolean;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ 
  onDateSelect, 
  selectedDate,
  availableDays = [], 
  highlightToday = true
}) => {
  // Function to determine the CSS class for each day
  const getDayClass = (date: Date) => {
    const isAvailable = availableDays.some(
      availableDay => 
        availableDay.getDate() === date.getDate() && 
        availableDay.getMonth() === date.getMonth() && 
        availableDay.getFullYear() === date.getFullYear()
    );
    
    if (isAvailable) {
      return "bg-green-50 text-green-700 hover:bg-green-100 font-medium";
    }
    return "";
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Select Date</CardTitle>
        {availableDays && availableDays.length > 0 && (
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 rounded-full bg-green-100 border border-green-600 mr-1.5"></span>
            <span className="text-gray-600">Available slots</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          className="rounded-md border"
          disabled={{ before: new Date() }}
          modifiers={{
            available: availableDays
          }}
          modifiersStyles={{
            available: { fontWeight: "bold", backgroundColor: "hsl(var(--muted))" }
          }}
          styles={{
            day_today: { 
              fontWeight: highlightToday ? "bold" : "normal",
              backgroundColor: highlightToday ? "hsl(var(--accent))" : ""
            }
          }}
        />
        <div className="mt-4 text-sm text-center">
          Selected: <span className="font-medium">{format(selectedDate, 'MMM dd, yyyy')}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCalendar;
