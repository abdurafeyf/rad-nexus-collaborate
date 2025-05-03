
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PatientFormValues } from "@/types/patient";

interface MedicalNotesSectionProps {
  form: UseFormReturn<PatientFormValues>;
}

const MedicalNotesSection: React.FC<MedicalNotesSectionProps> = ({ form }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Additional Information</h3>
      
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Medical Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any important notes about the patient's medical history..."
                className="min-h-[100px] border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default MedicalNotesSection;
