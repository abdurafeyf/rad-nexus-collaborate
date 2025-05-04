
import React from "react";
import { Calendar } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PatientFormValues } from "@/types/patient";
import ScanUploader from "./ScanUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScanRecordsSectionProps {
  form: UseFormReturn<PatientFormValues>;
  patientId?: string;
  patientName?: string;
  doctorId?: string;
  isDoctor?: boolean;
}

const ScanRecordsSection: React.FC<ScanRecordsSectionProps> = ({ 
  patientId,
  patientName,
  doctorId,
  isDoctor = true 
}) => {
  return (
    <Card className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">Scan Records</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isDoctor && patientId && patientName && doctorId ? (
          <ScanUploader 
            patientId={patientId}
            patientName={patientName}
            doctorId={doctorId}
          />
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>
              {isDoctor
                ? "Save the patient record first to enable scan uploads"
                : "No scan records available"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScanRecordsSection;
