
import React, { useState } from "react";
import { Upload, FileUp, Loader2, FileCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import VoiceInput from "./VoiceInput";

interface ScanUploaderProps {
  patientId: string;
  patientName: string;
  doctorId: string;
  onComplete?: () => void;
}

type FileUploadStatus = {
  id: string;
  name: string;
  progress: number;
  error?: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  reportId?: string;
};

const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png,.dcm,.dicom,.pdf";

const ScanUploader: React.FC<ScanUploaderProps> = ({ patientId, patientName, doctorId, onComplete }) => {
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<string>("");
  const [isVoiceLoading, setIsVoiceLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Maximum retry attempts for handling transient errors
  const MAX_RETRIES = 2;
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    // Convert FileList to array and process each file
    Array.from(selectedFiles).forEach(file => {
      processFile(file);
    });
    
    // Reset the file input
    e.target.value = '';
  };

  const handleTranscriptReceived = (transcript: string) => {
    setVoiceNotes(transcript);
  };

  const processFile = async (file: File) => {
    const fileId = crypto.randomUUID();
    
    // Add file to status tracking
    setFileStatuses(prev => [
      ...prev, 
      { 
        id: fileId, 
        name: file.name, 
        progress: 0, 
        status: 'uploading'
      }
    ]);
    
    try {
      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${fileId}.${fileExt}`;
      
      // Define upload options
      const uploadOptions = {
        cacheControl: '3600',
      };
      
      // Manually track progress with XHR
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      
      // Setup progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.floor((event.loaded / event.total) * 100);
          updateFileStatus(fileId, { progress: percent });
        }
      });
      
      // Upload with standard method
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("scans")
        .upload(fileName, file, uploadOptions);
      
      if (uploadError) throw uploadError;
      
      updateFileStatus(fileId, { progress: 100, status: 'processing' });
      
      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from("scans")
        .getPublicUrl(uploadData.path);
      
      // Get file type for display
      let scanType = 'Unknown';
      if (file.type.includes('image')) {
        scanType = 'Image';
      } else if (file.name.toLowerCase().endsWith('dcm') || file.name.toLowerCase().endsWith('dicom')) {
        scanType = 'DICOM';
      } else if (file.type.includes('pdf')) {
        scanType = 'Document';
      }
      
      // 2. Insert scan record in database
      const { data: scanData, error: scanError } = await supabase
        .from("scan_records")
        .insert([
          {
            patient_id: patientId,
            file_url: uploadData.path,
            scan_type: scanType,
            date_taken: new Date().toISOString().split("T")[0],
            doctor_id: doctorId,
            visibility: "both",
            uploaded_by: doctorId, // Using doctorId as uploaded_by
            notes: voiceNotes || `${scanType} scan of ${patientName}`
          }
        ])
        .select()
        .single();
      
      if (scanError) throw scanError;
      
      // 3. Call OpenAI Vision API to generate report (only for image types)
      if (file.type.includes('image')) {
        // Get the session data
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        const session = sessionData?.session;
        const accessToken = session?.access_token;
        
        if (!accessToken) {
          throw new Error("Authentication required to generate reports.");
        }
        
        // Add retry functionality for report generation
        let generateReportResponse = null;
        let reportData = null;
        let attempts = 0;
        
        while (attempts <= MAX_RETRIES) {
          try {
            // Add cache-busting parameter to URL
            const cacheBuster = `?t=${Date.now()}`;
            const imageUrlWithCacheBuster = `${publicUrl}${cacheBuster}`;
            
            generateReportResponse = await fetch(`https://ruueewpswsmmagpsxbvk.supabase.co/functions/v1/generate-report`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify({
                imageUrl: imageUrlWithCacheBuster,
                patientName,
                patientId,
                scanType,
                fileName: file.name,
                voiceNotes: voiceNotes // Include voice transcription in report generation
              })
            });
            
            if (!generateReportResponse.ok) {
              const errorData = await generateReportResponse.json();
              const errorMessage = errorData.error || 'Unknown error occurred';
              
              // If this is our last retry attempt, throw the error
              if (attempts === MAX_RETRIES) {
                throw new Error(`Report generation failed: ${errorMessage}`);
              }
              
              console.error(`Attempt ${attempts + 1} failed: ${errorMessage}`);
              attempts++;
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * (2 ** attempts)));
              continue;
            }
            
            // Success case
            reportData = await generateReportResponse.json();
            break;
          } catch (error: any) {
            // If this is our last retry attempt, throw the error
            if (attempts === MAX_RETRIES) {
              throw error;
            }
            
            console.error(`Attempt ${attempts + 1} failed: ${error.message}`);
            attempts++;
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (2 ** attempts)));
          }
        }
        
        if (!reportData || !reportData.report) {
          throw new Error("Invalid report data received from API");
        }
        
        // 4. Insert report in database
        const { data: savedReport, error: reportError } = await supabase
          .from("reports")
          .insert([
            {
              scan_record_id: scanData.id,
              patient_id: patientId,
              content: reportData.report,
              report_text: reportData.report_text,
              status: 'draft',
              hospital_name: 'Radixpert Medical Center',
              generated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();
        
        if (reportError) throw reportError;
        
        // Update status with report ID for linking
        updateFileStatus(fileId, { 
          status: 'complete', 
          reportId: savedReport.id
        });
        
        // Create notification for the patient
        await supabase
          .from("notifications")
          .insert([
            {
              patient_id: patientId,
              title: "New Scan Report Available",
              message: `A new ${scanType} scan has been analyzed and a report is now available.`,
              read: false
            }
          ]);
          
      } else {
        // For non-image files like PDFs or DICOMs just mark as complete
        // In a real app, you might have specialized handlers for these
        updateFileStatus(fileId, { status: 'complete' });
        
        // Create a placeholder report entry
        const { data: savedReport, error: reportError } = await supabase
          .from("reports")
          .insert([
            {
              scan_record_id: scanData.id,
              patient_id: patientId,
              content: `# ${scanType} File Uploaded\n\nFile: ${file.name}\nUploaded: ${new Date().toLocaleString()}\n\n${voiceNotes ? `Doctor's Voice Notes: ${voiceNotes}\n\n` : ''}This file type requires manual review by a medical professional.`,
              status: 'draft',
              hospital_name: 'Radixpert Medical Center',
              generated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();
          
        if (reportError) throw reportError;
        
        // Update status with report ID for linking
        updateFileStatus(fileId, { 
          status: 'complete', 
          reportId: savedReport.id
        });
      }
      
      toast({
        title: "Scan processed successfully",
        description: `${file.name} was uploaded and processed.`,
      });
      
    } catch (error: any) {
      console.error(`Error processing file ${file.name}:`, error);
      updateFileStatus(fileId, { 
        status: 'error', 
        error: error.message || 'Failed to process file'
      });
      
      toast({
        title: "Error processing scan",
        description: error.message || "Failed to process scan file",
        variant: "destructive",
      });
    }
  };
  
  const updateFileStatus = (fileId: string, updates: Partial<FileUploadStatus>) => {
    setFileStatuses(prev => 
      prev.map(item => item.id === fileId ? { ...item, ...updates } : item)
    );
  };
  
  const handleViewReport = (reportId: string) => {
    navigate(`/doctor/reports/${reportId}/review`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="scan-upload">Upload Scans (Images, PDFs, DICOM)</Label>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:bg-gray-50 transition-all flex flex-col items-center justify-center"
          onClick={() => document.getElementById('scan-upload')?.click()}
        >
          <FileUp className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-500 mb-1">
            Click to select files or drag and drop
          </p>
          <p className="text-xs text-gray-400">
            Supports JPG, PNG, PDF, and DICOM files
          </p>
          <input
            id="scan-upload"
            type="file"
            multiple
            className="hidden"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
          />
        </div>
      </div>
      
      <div className="space-y-4 border rounded-lg p-5 bg-gray-50">
        <h3 className="font-medium text-gray-700">Voice Notes</h3>
        <p className="text-sm text-gray-500">Record notes about the scan to include in the report</p>
        
        <VoiceInput 
          onTranscriptReceived={handleTranscriptReceived}
          isLoading={isVoiceLoading}
          setIsLoading={setIsVoiceLoading}
        />
        
        {voiceNotes && (
          <div className="space-y-2">
            <Label htmlFor="voice-notes">Transcript</Label>
            <Textarea
              id="voice-notes"
              value={voiceNotes}
              onChange={(e) => setVoiceNotes(e.target.value)}
              className="min-h-[100px]"
              placeholder="Voice transcription will appear here..."
            />
          </div>
        )}
      </div>
      
      {fileStatuses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Upload Status</h3>
          <div className="space-y-3">
            {fileStatuses.map((file) => (
              <div key={file.id} className="border rounded-md p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate max-w-[60%]">{file.name}</span>
                  <div className="flex items-center">
                    {file.status === 'uploading' && (
                      <span className="text-xs text-amber-600 flex items-center">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading
                      </span>
                    )}
                    {file.status === 'processing' && (
                      <span className="text-xs text-blue-600 flex items-center">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing
                      </span>
                    )}
                    {file.status === 'complete' && (
                      <span className="text-xs text-green-600 flex items-center">
                        <FileCheck className="h-3 w-3 mr-1" />
                        Complete
                      </span>
                    )}
                    {file.status === 'error' && (
                      <span className="text-xs text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Error
                      </span>
                    )}
                  </div>
                </div>
                
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="h-1" />
                )}
                
                {file.status === 'error' && file.error && (
                  <Alert variant="destructive" className="mt-2 py-2 px-3">
                    <AlertDescription className="text-xs">
                      {file.error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {file.status === 'complete' && file.reportId && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleViewReport(file.reportId!)}
                    >
                      View Report
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanUploader;
