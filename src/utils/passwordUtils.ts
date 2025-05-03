
import { supabase } from "@/integrations/supabase/client";

export const generateTemporaryPassword = (length = 10): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  
  // Ensure we have at least one of each: uppercase, lowercase, number, and special character
  password += charset.charAt(Math.floor(Math.random() * 26) + 26); // uppercase
  password += charset.charAt(Math.floor(Math.random() * 26)); // lowercase
  password += charset.charAt(Math.floor(Math.random() * 10) + 52); // number
  password += charset.charAt(Math.floor(Math.random() * 12) + 62); // special char
  
  // Fill the rest of the password
  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

export interface PatientAuthParams {
  email: string;
  password: string;
}

export const createPatientAuth = async ({ email, password }: PatientAuthParams) => {
  try {
    console.log("Creating patient auth account for:", email);
    
    // Create the auth user
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          user_type: "patient"
        }
      }
    });
    
    if (error) {
      console.error("Error in signUp:", error);
      throw error;
    }
    
    console.log("Patient auth created successfully:", data.user?.id);
    return { success: true, userId: data.user?.id, userExists: false };
  } catch (error: any) {
    console.error("Error creating patient auth:", error);
    return { success: false, error };
  }
};

// We're removing the sendPatientWelcomeEmail function as we're using notifications instead
