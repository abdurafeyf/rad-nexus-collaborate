
import React from "react";
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
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Report = {
  id: string;
  scan_record_id: string;
  patient_id: string;
  content: string;
  status: string; // Using string instead of union type to match the database
  created_at: string;
  updated_at: string;
  published_at: string | null;
  scan_type?: string;
};

interface PatientReportsListProps {
  patientId: string;
  reports: Report[];
  isLoading: boolean;
  onViewReport: (reportId: string) => void;
}

const PatientReportsList: React.FC<PatientReportsListProps> = ({
  patientId,
  reports,
  isLoading,
  onViewReport,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Reports</CardTitle>
        <CardDescription>
          View and manage diagnostic reports for this patient
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
          </div>
        ) : reports.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scan Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onViewReport(report.id)}
                >
                  <TableCell className="font-medium">{report.scan_type || "Unknown"}</TableCell>
                  <TableCell>
                    {report.status === "published" ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.updated_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-500">No reports available for this patient</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientReportsList;
