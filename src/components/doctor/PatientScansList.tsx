
import React from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

type ScanRecord = {
  id: string;
  patient_id: string;
  scan_type: string;
  date_taken: string;
  file_url: string;
  created_at: string;
  notes?: string;
  body_part?: string;
};

interface PatientScansListProps {
  patientId: string;
  scans: ScanRecord[];
  isLoading: boolean;
}

const PatientScansList: React.FC<PatientScansListProps> = ({ patientId, scans, isLoading }) => {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Patient Scans</CardTitle>
          <CardDescription>
            View and manage medical scans for this patient
          </CardDescription>
        </div>
        <Button onClick={() => navigate(`/doctor/patients/${patientId}/scan`)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Scan
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
          </div>
        ) : scans.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date Taken</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((scan) => (
                <TableRow
                  key={scan.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/doctor/scans/${scan.id}`)}
                >
                  <TableCell className="font-medium">{scan.scan_type}</TableCell>
                  <TableCell>
                    {format(new Date(scan.date_taken), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {scan.notes
                      ? scan.notes.length > 30
                        ? scan.notes.substring(0, 30) + "..."
                        : scan.notes
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(scan.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Upload className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-500">No scans available for this patient</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate(`/doctor/patients/${patientId}/scan`)}
            >
              Upload a Scan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientScansList;
