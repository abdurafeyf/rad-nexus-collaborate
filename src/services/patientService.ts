
import { supabase } from "@/integrations/supabase/client";
import { createPatientAuth, generateTemporaryPassword, sendPatientWelcomeEmail } from "@/utils/passwordUtils";

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
    let temporaryPassword;

    if (!existingPatient) {
      // Generate a secure temporary password for new patients
      temporaryPassword = generateTemporaryPassword(12);
      console.log("Generated temporary password:", temporaryPassword);
      
      // For new patients, create a patient record directly
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
      
      // Create auth account for the patient
      const authResult = await createPatientAuth({
        email: params.email,
        password: temporaryPassword,
      });
      
      if (!authResult.success) {
        console.warn("Failed to create auth account for patient, but patient record was created", authResult.error);
      } else {
        console.log("Patient auth account created successfully");
      }
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

    // Send email to patient - but only for new patients
    if (isNewPatient && temporaryPassword) {
      try {
        console.log("Sending welcome email to patient");
        await sendPatientWelcomeEmail(params.email, params.name, temporaryPassword);
      } catch (emailError) {
        console.error("Failed to send email, but patient was added successfully:", emailError);
        // Don't throw here, just return success with a warning
        return {
          success: true,
          isNewPatient,
          patientId,
          error: "Patient added but welcome email could not be sent"
        };
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
