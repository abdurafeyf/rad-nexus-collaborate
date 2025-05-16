
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { format } from "date-fns";
import { User } from "lucide-react";

type Patient = {
  id: string;
  name: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
  phone_number?: string;
  address?: string;
  medical_history?: string;
  created_at: string;
};

interface PatientInfoCardProps {
  patient: Patient;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patient }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-500" />
          Patient Information
        </CardTitle>
        <CardDescription>Basic patient details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Full Name</p>
          <p>{patient.name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Email</p>
          <p>{patient.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Date of Birth</p>
          <p>
            {patient.date_of_birth
              ? format(new Date(patient.date_of_birth), "MMM d, yyyy")
              : "Not specified"}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Gender</p>
          <p>
            {patient.gender
              ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
              : "Not specified"}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Phone</p>
          <p>{patient.phone_number || "Not specified"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Address</p>
          <p>{patient.address || "Not specified"}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;
