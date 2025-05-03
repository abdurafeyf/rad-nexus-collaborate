
import React from "react";
import { PlusCircle, Trash, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { PatientFormValues } from "@/types/patient";

interface ScanRecordsSectionProps {
  form: UseFormReturn<PatientFormValues>;
}

const ScanRecordsSection: React.FC<ScanRecordsSectionProps> = ({ form }) => {
  // Add new scan field
  const addScan = () => {
    const currentScans = form.getValues("xrays") || [];
    form.setValue("xrays", [
      ...currentScans,
      { date: new Date(), file: undefined, scanType: "X-Ray" },
    ]);
  };

  // Remove scan field
  const removeScan = (index: number) => {
    const currentScans = form.getValues("xrays") || [];
    const newScans = [...currentScans];
    newScans.splice(index, 1);
    form.setValue("xrays", newScans);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Scan Records</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addScan}
          className="border-teal-200 hover:bg-teal-50 text-teal-600"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Scan
        </Button>
      </div>

      {form.watch("xrays")?.length ? (
        <div className="space-y-4">
          {form.watch("xrays")?.map((scan, index) => (
            <div
              key={index}
              className="rounded-md border border-gray-200 p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Scan #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeScan(index)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-3 space-y-3">
                <FormField
                  control={form.control}
                  name={`xrays.${index}.scanType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Scan Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-200 focus:ring-teal-500">
                            <SelectValue placeholder="Select scan type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="X-Ray">X-Ray</SelectItem>
                          <SelectItem value="MRI">MRI</SelectItem>
                          <SelectItem value="CT">CT Scan</SelectItem>
                          <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
          <p>No scan records added yet</p>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={addScan}
            className="mt-2 text-teal-600 hover:text-teal-700"
          >
            Add your first scan record
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScanRecordsSection;
