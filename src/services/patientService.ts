
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
    // Check if patient already exists
    const { data: existingPatient, error: checkError } = await supabase
      .from("patients")
      .select("id")
      .eq("email", params.email)
      .maybeSingle();

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
        throw patientError;
      }

      patientId = patient.id;
    } else {
      patientId = existingPatient.id;
    }

    // Handle X-rays if any
    if (params.xrays && params.xrays.length > 0) {
      for (const xray of params.xrays) {
        // Insert X-ray record
        const { error: xrayError } = await supabase
          .from("x_rays")
          .insert({
            patient_id: patientId,
            date: xray.date.toISOString().split("T")[0],
            scan_type: xray.scanType
          });

        if (xrayError) {
          throw xrayError;
        }
      }
    }

    // Create notification for new patients
    if (isNewPatient) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          patient_id: patientId,
          title: "Welcome to RaDixpert",
          message: "Your doctor has added you to RaDixpert. Please sign up using your email address to access your medical records and reports.",
        });

      if (notificationError) {
        console.error("Failed to create welcome notification:", notificationError);
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
