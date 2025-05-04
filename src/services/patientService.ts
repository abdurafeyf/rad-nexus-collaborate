
import { supabase } from "@/integrations/supabase/client";

export interface CreatePatientParams {
  name: string;
  email: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | '';
  notes?: string;
  doctorId: string;
  xrays?: {
    date: Date;
    scanType: "X-Ray" | "MRI" | "CT" | "Ultrasound" | "Other";
  }[];
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
    } else {
      patientId = existingPatient.id;
      console.log("Using existing patient ID:", patientId);
    }

    // Handle X-rays if any
    if (params.xrays && params.xrays.length > 0) {
      console.log("Processing X-rays for patient:", patientId);
      for (const xray of params.xrays) {
        // Insert X-ray record
        const { error: xrayError, data: xrayData } = await supabase
          .from("x_rays")
          .insert({
            patient_id: patientId,
            date: xray.date.toISOString().split("T")[0],
            scan_type: xray.scanType
          })
          .select();

        if (xrayError) {
          console.error("Error creating x-ray record:", xrayError);
          throw xrayError;
        }
        
        console.log("X-ray record created:", xrayData);
        
        // Create a corresponding report entry for each X-ray
        if (xrayData && xrayData.length > 0) {
          const xrayId = xrayData[0].id;
          const { error: reportError } = await supabase
            .from("reports")
            .insert({
              patient_id: patientId,
              scan_id: xrayId,
              content: `Initial assessment for ${params.name}'s ${xray.scanType} scan from ${xray.date.toLocaleDateString()}.`,
              status: 'pending',
              hospital_name: 'Radixpert Medical Center'
            });
            
          if (reportError) {
            console.error("Error creating report for x-ray:", reportError);
            throw reportError;
          }
          console.log("Report created for x-ray:", xrayId);
        }
      }
    } else {
      // Even if no X-rays, create a default case/report for the patient
      console.log("Creating default case report for patient:", patientId);
      const { error: defaultReportError } = await supabase
        .from("reports")
        .insert({
          patient_id: patientId,
          // Use null for scan_id as there's no scan yet
          scan_id: null, 
          content: `Initial case opened for ${params.name}. No scans uploaded yet.`,
          status: 'pending',
          hospital_name: 'Radixpert Medical Center'
        });
        
      if (defaultReportError) {
        // If the error is due to scan_id being non-nullable, we handle it
        if (defaultReportError.message.includes('null value in column "scan_id"')) {
          console.warn("Could not create default report without scan_id - this is expected if scan_id is non-nullable");
        } else {
          console.error("Error creating default report:", defaultReportError);
          throw defaultReportError;
        }
      } else {
        console.log("Default case report created for patient");
      }
    }

    // Create notification for new patients
    if (isNewPatient) {
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
      // Create notification for existing patients
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          patient_id: patientId,
          title: "New Medical Information Added",
          message: "Your doctor has updated your information. Please log in to view the changes.",
        });

      if (notificationError) {
        console.error("Failed to create update notification:", notificationError);
      } else {
        console.log("Update notification created for existing patient");
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

// New function to check if an email exists in the patients table
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
