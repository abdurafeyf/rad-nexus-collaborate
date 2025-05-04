
import { supabase } from "@/integrations/supabase/client";

export interface CreatePatientParams {
  name: string;
  email: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | '';
  notes?: string;
  doctorId: string;
  xrays?: { date: Date; scanType: string }[]; // Added xrays property to fix type error
}

export interface PatientCreationResult {
  success: boolean;
  isNewPatient: boolean;
  patientId?: string;
  error?: string;
}

export const createPatient = async (params: CreatePatientParams): Promise<PatientCreationResult> => {
  try {
    console.log("Creating/updating patient with params:", params);
    // Check if patient already exists
    const { data: existingPatient, error: checkError } = await supabase
      .from("patients")
      .select("id")
      .eq("email", params.email)
      .maybeSingle();

    console.log("Existing patient check:", existingPatient, checkError);

    let patientId;
    let isNewPatient = !existingPatient;

    if (!existingPatient) {
      // For new patients, create a patient record
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          name: params.name,
          email: params.email,
          date_of_birth: params.dateOfBirth ? params.dateOfBirth.toISOString().split("T")[0] : null,
          gender: params.gender || null,
          notes: params.notes || null,
          doctor_id: params.doctorId,
        })
        .select()
        .single();

      if (patientError) {
        console.error("Error creating patient:", patientError);
        throw patientError;
      }

      console.log("New patient created:", patient);
      patientId = patient.id;
      
      // Create notification for new patients
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          patient_id: patientId,
          title: "Welcome to Radixpert",
          message: "Your doctor has added you to Radixpert. Please sign up using your email address to access your medical records and reports.",
        });

      if (notificationError) {
        console.error("Failed to create welcome notification:", notificationError);
      } else {
        console.log("Welcome notification created for new patient");
      }
    } else {
      patientId = existingPatient.id;
      console.log("Using existing patient ID:", patientId);
      
      // Update patient information
      const { error: updateError } = await supabase
        .from("patients")
        .update({
          name: params.name,
          date_of_birth: params.dateOfBirth ? params.dateOfBirth.toISOString().split("T")[0] : null,
          gender: params.gender || null,
          notes: params.notes || null,
          updated_at: new Date().toISOString(),
          doctor_id: params.doctorId,
        })
        .eq("id", patientId);
        
      if (updateError) {
        console.error("Error updating patient:", updateError);
        throw updateError;
      }
      
      // Create notification for existing patients
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          patient_id: patientId,
          title: "Medical Information Updated",
          message: "Your doctor has updated your information. Please log in to view the changes.",
        });

      if (notificationError) {
        console.error("Failed to create update notification:", notificationError);
      } else {
        console.log("Update notification created for existing patient");
      }
    }
    
    // Create a placeholder scan only for new patients
    if (isNewPatient) {
      // Create a placeholder scan
      const { data: placeholderScan, error: scanError } = await supabase
        .from("scans")
        .insert({
          patient_id: patientId,
          doctor_id: params.doctorId,
          file_path: "placeholder.jpg", // Placeholder file path
          file_type: "placeholder"      // Placeholder file type
        })
        .select();
      
      if (scanError) {
        console.error("Error creating placeholder scan:", scanError);
        throw scanError;
      }
      
      console.log("Placeholder scan created:", placeholderScan);
      
      // Now create the report with the scan_id from the placeholder scan
      if (placeholderScan && placeholderScan.length > 0) {
        const scanId = placeholderScan[0].id;
        const { error: reportError } = await supabase
          .from("reports")
          .insert({
            patient_id: patientId,
            scan_id: scanId,
            content: `Initial case opened for ${params.name}. No scans uploaded yet.`,
            status: 'draft',
            hospital_name: 'Radixpert Medical Center'
          });
          
        if (reportError) {
          console.error("Error creating default report:", reportError);
          throw reportError;
        }
        console.log("Default report created with placeholder scan");
      }
    }

    return {
      success: true,
      isNewPatient,
      patientId
    };
  } catch (error: any) {
    console.error("Error in createPatient:", error);
    return {
      success: false,
      isNewPatient: false,
      error: error.message
    };
  }
};

// Function to check if an email exists in the patients table
export const checkPatientEmail = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("id")
      .eq("email", email)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // If there's an error other than "no rows returned", log it
      console.error("Error checking patient email:", error);
      return false;
    }
    
    // If we found a patient with this email, return true
    return !!data;
  } catch (error) {
    console.error("Unexpected error checking patient email:", error);
    return false;
  }
};
