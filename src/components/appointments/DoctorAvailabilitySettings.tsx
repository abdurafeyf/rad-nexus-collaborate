
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getDoctorIdFromUserId } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const TIME_SLOTS = Array.from({ length: 24 * 2 }).map((_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const ampm = hour < 12 ? "AM" : "PM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const label = `${hour12}:${minute} ${ampm}`;
  const value = `${hour.toString().padStart(2, "0")}:${minute}`;
  return { label, value };
});

interface Availability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DoctorAvailabilitySettings: React.FC = () => {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  const [selectedDay, setSelectedDay] = useState("1"); // Default to Monday
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [isAvailable, setIsAvailable] = useState(true);
  const { toast } = useToast();

  // Fetch doctor ID when component loads
  useEffect(() => {
    const fetchDoctorId = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user?.id) return;
        
        const docId = await getDoctorIdFromUserId(userData.user.id);
        if (docId) {
          setDoctorId(docId);
          fetchAvailability(docId);
        }
      } catch (error) {
        console.error("Error fetching doctor ID:", error);
      }
    };
    
    fetchDoctorId();
  }, []);

  // Fetch doctor's availability
  const fetchAvailability = async (docId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", docId);
        
      if (error) throw error;
      
      // Convert array to record keyed by day_of_week
      const availabilityRecord: Record<string, Availability> = {};
      data.forEach(item => {
        availabilityRecord[item.day_of_week.toString()] = item;
      });
      
      setAvailability(availabilityRecord);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // When day selection changes, update form with saved data if exists
  useEffect(() => {
    const savedData = availability[selectedDay];
    if (savedData) {
      setStartTime(savedData.start_time);
      setEndTime(savedData.end_time);
      setIsAvailable(savedData.is_available);
    } else {
      // Reset to defaults
      setStartTime("09:00");
      setEndTime("17:00");
      setIsAvailable(true);
    }
  }, [selectedDay, availability]);

  const saveAvailability = async () => {
    if (!doctorId) return;
    
    try {
      setIsLoading(true);
      
      const existingData = availability[selectedDay];
      
      if (existingData?.id) {
        // Update existing
        const { error } = await supabase
          .from("doctor_availability")
          .update({
            start_time: startTime,
            end_time: endTime,
            is_available: isAvailable
          })
          .eq("id", existingData.id);
          
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("doctor_availability")
          .insert({
            doctor_id: doctorId,
            day_of_week: parseInt(selectedDay),
            start_time: startTime,
            end_time: endTime,
            is_available: isAvailable
          });
          
        if (error) throw error;
      }
      
      // Refresh data
      fetchAvailability(doctorId);
      
      toast({
        title: "Availability saved",
        description: `Your availability for ${DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label} has been updated.`,
      });
    } catch (error: any) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error saving availability",
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
        <CardTitle className="text-lg">Manage Your Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Day selection */}
        <div className="space-y-1">
          <label htmlFor="day" className="text-sm font-medium">
            Day of Week
          </label>
          <Select 
            value={selectedDay} 
            onValueChange={setSelectedDay}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((day) => (
                <SelectItem key={day.value} value={day.value}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Available toggle */}
        <div className="flex items-center space-x-2">
          <Switch 
            id="availability" 
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
          />
          <Label htmlFor="availability">
            {isAvailable ? "Available for appointments" : "Not available"}
          </Label>
        </div>
        
        {/* Time range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="startTime" className="text-sm font-medium">
              Start Time
            </label>
            <Select 
              value={startTime} 
              onValueChange={setStartTime}
              disabled={!isAvailable}
            >
              <SelectTrigger>
                <SelectValue placeholder="Start time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="endTime" className="text-sm font-medium">
              End Time
            </label>
            <Select 
              value={endTime} 
              onValueChange={setEndTime}
              disabled={!isAvailable}
            >
              <SelectTrigger>
                <SelectValue placeholder="End time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Save button */}
        <Button 
          onClick={saveAvailability} 
          className="w-full bg-teal-500 hover:bg-teal-600"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            'Save Availability'
          )}
        </Button>
        
        {/* Availability status legend */}
        <div className="pt-4 border-t mt-4">
          <h4 className="font-medium text-sm mb-2">Your Current Availability:</h4>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const dayData = availability[day.value];
              return (
                <div key={day.value} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{day.label}:</span>
                  {dayData ? (
                    <span className={dayData.is_available ? "text-green-600" : "text-red-600"}>
                      {dayData.is_available 
                        ? `${dayData.start_time} - ${dayData.end_time}` 
                        : "Not available"}
                    </span>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorAvailabilitySettings;
