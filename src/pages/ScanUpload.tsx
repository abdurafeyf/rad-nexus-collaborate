
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, File, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NewSidebar from "@/components/NewSidebar";

const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/dicom': ['.dcm', '.dicom'],
};

const SCAN_TYPES = [
  { value: "xray", label: "X-Ray" },
  { value: "mri", label: "MRI" },
  { value: "ct", label: "CT Scan" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "mammogram", label: "Mammogram" },
  { value: "dexa", label: "DEXA (Bone Density)" },
  { value: "pet", label: "PET Scan" },
  { value: "other", label: "Other" }
];

type PatientDetails = {
  id: string;
  name: string;
  email: string;
};

const ScanUpload = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [hospitalName, setHospitalName] = useState<string>("");
  const [scanType, setScanType] = useState<string>("");
  const [otherScanType, setOtherScanType] = useState<string>("");

  // Fetch patient details
  React.useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        if (!patientId) return;
        
        const { data, error } = await supabase
          .from("patients")
          .select("id, name, email")
          .eq("id", patientId)
          .single();
        
        if (error) throw error;
        
        setPatientDetails(data as PatientDetails);
      } catch (error: any) {
        toast({
          title: "Error fetching patient details",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    
    fetchPatientDetails();
  }, [patientId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;
    
    // Check file type
    const fileType = selectedFile.type;
    const validTypes = Object.keys(ACCEPTED_FILE_TYPES);
    
    if (!validTypes.includes(fileType)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or DICOM file.",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview for images
    if (fileType.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For DICOM files just show an icon
      setFilePreview(null);
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !patientId || !scanType) {
      toast({
        title: "Missing information",
        description: scanType ? "Please select a file to upload." : "Please select a scan type.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;
      
      const { data: fileData, error: fileError } = await supabase.storage
        .from("scans")
        .upload(fileName, file);
      
      if (fileError) throw fileError;
      
      const filePath = fileData.path;
      
      // Get the doctor ID from session
      const { data: { session } } = await supabase.auth.getSession();
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", session?.user.id || '')
        .single();
        
      if (doctorError) throw doctorError;
      
      const finalScanType = scanType === "other" ? otherScanType : 
        SCAN_TYPES.find(s => s.value === scanType)?.label || scanType;
      
      // 2. Create scan record in database
      const { data: scanData, error: scanError } = await supabase
        .from("scans")
        .insert([
          {
            patient_id: patientId,
            file_path: filePath,
            file_type: file.type,
            doctor_id: doctorData.id,
            scan_type: finalScanType
          }
        ])
        .select()
        .single();
      
      if (scanError) throw scanError;

      // 3. Generate AI report (in real app, call OpenAI API here)
      // For now, we'll create a placeholder report
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .insert([
          {
            scan_id: scanData.id,
            patient_id: patientId,
            content: `# Radiology Report\n\n## Patient Information\nPatient ID: ${patientId}\n\n## Scan Type\n${finalScanType}\n\n## Analysis\nThis is a placeholder for an AI-generated report. In a production environment, this would be generated by analyzing the uploaded scan using OpenAI's Vision API.\n\n## Findings\nNo findings available in this demo version.\n\n## Impression\nDemo impression text.`,
            hospital_name: hospitalName || "Main Hospital"
          }
        ])
        .select()
        .single();
      
      if (reportError) throw reportError;
      
      toast({
        title: "Upload successful",
        description: "Scan uploaded and draft report generated.",
      });
      
      // Navigate to report review page
      navigate(`/doctor/reports/${reportData.id}/review`);
      
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NewSidebar type="doctor">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <main className="flex-grow container mx-auto py-8 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/doctor/patients/${patientId}`)}
            className="mb-6 -ml-3"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patient
          </Button>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Upload Patient Scan</h1>
            {patientDetails && (
              <p className="text-gray-500">
                Patient: {patientDetails.name} ({patientDetails.email})
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Scan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital/Institution Name</Label>
                    <Input 
                      id="hospital" 
                      value={hospitalName} 
                      onChange={(e) => setHospitalName(e.target.value)} 
                      placeholder="Enter hospital or institution name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scanType">Scan Type</Label>
                    <Select value={scanType} onValueChange={setScanType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scan type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCAN_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {scanType === "other" && (
                    <div className="space-y-2">
                      <Label htmlFor="otherScanType">Specify Scan Type</Label>
                      <Input
                        id="otherScanType"
                        value={otherScanType}
                        onChange={(e) => setOtherScanType(e.target.value)}
                        placeholder="Enter scan type"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="scan">Scan File (JPEG, PNG, or DICOM)</Label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:bg-gray-50 transition-all flex flex-col items-center justify-center"
                      onClick={() => document.getElementById("scan")?.click()}
                    >
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="max-h-64 mb-4" />
                      ) : file ? (
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                          <File className="h-12 w-12 text-gray-500" />
                        </div>
                      ) : (
                        <Upload className="h-12 w-12 text-gray-500 mb-4" />
                      )}
                      
                      <p className="text-sm text-gray-500">
                        {file ? file.name : "Click to select or drag and drop a file"}
                      </p>
                      
                      <input
                        id="scan"
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.dcm,.dicom,image/jpeg,image/png,application/dicom"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleUpload} 
                  disabled={isLoading || !file || !scanType || (scanType === "other" && !otherScanType)}
                >
                  {isLoading ? "Uploading..." : "Upload and Generate Report"}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>What happens next?</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-4">
                  <li>
                    <p className="font-medium">Upload the scan</p>
                    <p className="text-sm text-gray-600">
                      Upload a JPEG, PNG, or DICOM file of the patient's radiology scan.
                    </p>
                  </li>
                  <li>
                    <p className="font-medium">AI-powered report generation</p>
                    <p className="text-sm text-gray-600">
                      Our system will analyze the scan using AI and generate a draft report.
                    </p>
                  </li>
                  <li>
                    <p className="font-medium">Review and edit</p>
                    <p className="text-sm text-gray-600">
                      You'll be able to review and edit the generated report before publishing it.
                    </p>
                  </li>
                  <li>
                    <p className="font-medium">Publish to patient</p>
                    <p className="text-sm text-gray-600">
                      Once approved, publish the report to make it available to the patient.
                    </p>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </NewSidebar>
  );
};

export default ScanUpload;
