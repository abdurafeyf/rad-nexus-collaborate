
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Download, File, Trash, Calendar, Upload } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ScanRecord {
  id: string;
  patient_id: string;
  scan_type: string;
  date_taken: string;
  file_url: string | null;
  notes: string | null;
  visibility: "both" | "admin" | "patient";
  created_at: string;
}

interface ScanRecordsListProps {
  patientId: string;
  isDoctor: boolean;
}

export const ScanRecordsList: React.FC<ScanRecordsListProps> = ({ patientId, isDoctor }) => {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  // Form state for new scan
  const [newScan, setNewScan] = useState<Partial<ScanRecord>>({
    scan_type: "X-Ray",
    date_taken: new Date().toISOString().split("T")[0],
    notes: "",
    visibility: "both"
  });
  const [scanFile, setScanFile] = useState<File | null>(null);

  useEffect(() => {
    fetchScanRecords();
  }, [patientId]);

  const fetchScanRecords = async () => {
    try {
      setIsLoading(true);

      // Fetch records from both scan_records and x_rays tables
      const [scanRecordsResult, xRaysResult] = await Promise.all([
        supabase
          .from("scan_records")
          .select("*")
          .eq("patient_id", patientId)
          .order("date_taken", { ascending: false }),
        supabase
          .from("x_rays")
          .select("id, patient_id, scan_type, date, file_path, notes, visibility, created_at")
          .eq("patient_id", patientId)
          .order("date", { ascending: false })
      ]);

      if (scanRecordsResult.error) throw scanRecordsResult.error;
      if (xRaysResult.error) throw xRaysResult.error;

      // Convert x_rays to match the scan_records format
      const normalizedXRays = xRaysResult.data.map(xray => ({
        id: xray.id,
        patient_id: xray.patient_id,
        scan_type: xray.scan_type || "X-Ray",
        date_taken: xray.date,
        file_url: xray.file_path,
        notes: xray.notes,
        // Cast visibility to the expected type with a default value if it doesn't match
        visibility: (xray.visibility === "both" || xray.visibility === "admin" || xray.visibility === "patient") 
          ? xray.visibility as "both" | "admin" | "patient" 
          : "both" as const,
        created_at: xray.created_at,
      }));

      // Apply the same normalization to scan_records to ensure consistent typing
      const normalizedScanRecords = scanRecordsResult.data.map(record => ({
        ...record,
        // Cast visibility to the expected type with a default value if it doesn't match
        visibility: (record.visibility === "both" || record.visibility === "admin" || record.visibility === "patient") 
          ? record.visibility as "both" | "admin" | "patient" 
          : "both" as const,
      }));
      
      // Combine records from both tables
      const combinedRecords: ScanRecord[] = [
        ...normalizedScanRecords,
        ...normalizedXRays
      ].sort((a, b) => new Date(b.date_taken).getTime() - new Date(a.date_taken).getTime());
      
      setRecords(combinedRecords);
    } catch (error: any) {
      console.error("Error fetching scan records:", error);
      toast({
        title: "Error",
        description: "Could not fetch scan records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setScanFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewScan(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "visibility" && (value === "both" || value === "admin" || value === "patient")) {
      setNewScan(prev => ({ ...prev, [name]: value as "both" | "admin" | "patient" }));
    } else if (name === "scan_type") {
      setNewScan(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setNewScan(prev => ({
      ...prev,
      date_taken: date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newScan.scan_type || !newScan.date_taken) {
      toast({
        title: "Validation Error",
        description: "Scan type and date are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // File storage path
      let fileUrl = null;
      
      if (scanFile) {
        // Check if "scans" bucket exists, create if not
        const { data: buckets } = await supabase.storage.listBuckets();
        const scanBucketExists = buckets?.some(bucket => bucket.name === "scans");
        
        if (!scanBucketExists) {
          await supabase.storage.createBucket("scans", {
            public: false
          });
        }
        
        // Upload file
        const fileExt = scanFile.name.split('.').pop();
        const fileName = `${patientId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("scans")
          .upload(fileName, scanFile);
          
        if (uploadError) throw uploadError;
        
        // Get URL
        const { data: urlData } = supabase.storage
          .from("scans")
          .getPublicUrl(fileName);
          
        fileUrl = urlData.publicUrl;
      }
      
      // Get current user for uploaded_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Save record to scan_records table
      const { error: insertError } = await supabase
        .from("scan_records")
        .insert({
          patient_id: patientId,
          scan_type: newScan.scan_type,
          date_taken: newScan.date_taken,
          file_url: fileUrl,
          notes: newScan.notes || null,
          visibility: newScan.visibility || "both",
          uploaded_by: user.id
        });
        
      if (insertError) throw insertError;
      
      // Reset form
      setNewScan({
        scan_type: "X-Ray",
        date_taken: new Date().toISOString().split("T")[0],
        notes: "",
        visibility: "both"
      });
      setScanFile(null);
      setIsAddDialogOpen(false);
      
      // Refresh the scan records list
      await fetchScanRecords();
      
      toast({
        title: "Success",
        description: "Scan record added successfully"
      });
    } catch (error: any) {
      console.error("Error adding scan record:", error);
      toast({
        title: "Error",
        description: "Could not add scan record",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteScan = async (id: string) => {
    try {
      // First check if this is in scan_records or x_rays
      const { data: scanRecord } = await supabase
        .from("scan_records")
        .select("id, file_url")
        .eq("id", id)
        .maybeSingle();
        
      if (scanRecord) {
        // Delete file if exists
        if (scanRecord.file_url) {
          const filePath = scanRecord.file_url.split("/").slice(-2).join("/");
          await supabase.storage.from("scans").remove([filePath]);
        }
        
        // Delete record
        const { error } = await supabase
          .from("scan_records")
          .delete()
          .eq("id", id);
          
        if (error) throw error;
      } else {
        // Try x_rays table
        const { data: xRay } = await supabase
          .from("x_rays")
          .select("id, file_path")
          .eq("id", id)
          .maybeSingle();
          
        if (xRay) {
          // Delete file if exists
          if (xRay.file_path) {
            const filePath = xRay.file_path.split("/").slice(-2).join("/");
            await supabase.storage.from("scans").remove([filePath]);
          }
          
          // Delete record
          const { error } = await supabase
            .from("x_rays")
            .delete()
            .eq("id", id);
            
          if (error) throw error;
        } else {
          throw new Error("Record not found");
        }
      }
      
      // Remove from local state
      setRecords(records.filter(record => record.id !== id));
      
      toast({
        title: "Success",
        description: "Scan record deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting scan record:", error);
      toast({
        title: "Error",
        description: "Could not delete scan record",
        variant: "destructive",
      });
    }
  };

  const downloadScan = async (fileUrl: string, scanType: string, dateTaken: string) => {
    try {
      if (!fileUrl) {
        toast({
          title: "Error",
          description: "No file available for download",
          variant: "destructive",
        });
        return;
      }
      
      // Format date for filename
      const formattedDate = format(new Date(dateTaken), "yyyy-MM-dd");
      const fileName = `${scanType.replace(' ', '_')}_${formattedDate}`;
      
      // Fetch the file
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Download Started",
        description: `Downloading ${scanType} from ${formattedDate}`
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Could not download file",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-subtle">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Scan Records</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="flex justify-between py-2">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-subtle">
      <CardHeader className="border-b flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Scan Records</CardTitle>
        {isDoctor && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline" 
                size="sm"
                className="border-teal-200 hover:bg-teal-50 text-teal-600"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Scan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Scan Record</DialogTitle>
                <DialogDescription>
                  Upload a new scan image or document for this patient.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scan_type">Scan Type</Label>
                  <Select 
                    value={newScan.scan_type || "X-Ray"} 
                    onValueChange={(value) => handleSelectChange("scan_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="MRI">MRI</SelectItem>
                      <SelectItem value="CT">CT Scan</SelectItem>
                      <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date_taken">Date Taken</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newScan.date_taken && "text-gray-400"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newScan.date_taken ? (
                          format(new Date(newScan.date_taken), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newScan.date_taken ? new Date(newScan.date_taken) : undefined}
                        onSelect={handleDateChange}
                        disabled={(date) => date > new Date()}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file">Upload File</Label>
                  <div className="border border-gray-200 rounded-md p-4">
                    <Input 
                      id="file" 
                      type="file" 
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label 
                      htmlFor="file" 
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      {scanFile ? (
                        <div className="space-y-1 text-center">
                          <File className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="text-sm text-gray-600 break-all">
                            {scanFile.name}
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round(scanFile.size / 1024)} KB
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="text-sm text-gray-600">
                            Click to upload scan file
                          </div>
                          <span className="text-xs text-gray-500">
                            PDF, JPG, PNG, or DICOM files
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes" 
                    name="notes"
                    value={newScan.notes || ""}
                    onChange={handleInputChange}
                    placeholder="Optional notes about this scan"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select 
                    value={newScan.visibility || "both"} 
                    onValueChange={(value) => handleSelectChange("visibility", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Doctor & Patient</SelectItem>
                      <SelectItem value="admin">Doctor Only</SelectItem>
                      <SelectItem value="patient">Patient Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-teal-500 hover:bg-teal-600"
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Save Scan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {records.length === 0 ? (
          <div className="text-center py-8">
            <File className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500">No scan records available</p>
            {isDoctor && (
              <Button 
                variant="ghost" 
                size="sm"
                className="mt-2 text-teal-600 hover:text-teal-700"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Add your first scan record
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.scan_type}</TableCell>
                  <TableCell>{format(new Date(record.date_taken), "PP")}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {record.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {record.file_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadScan(record.file_url!, record.scan_type, record.date_taken)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                      )}
                      
                      {isDoctor && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteScan(record.id)}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

