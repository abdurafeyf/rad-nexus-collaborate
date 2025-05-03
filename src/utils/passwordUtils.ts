
import { supabase } from "@/integrations/supabase/client";

export const generateTemporaryPassword = (length = 10): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

export interface PatientAuthParams {
  email: string;
  password: string;
}

export const createPatientAuth = async ({ email, password }: PatientAuthParams) => {
  try {
    // Create the auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: "patient"
      }
    });
    
    if (error) throw error;
    
    return { success: true, userId: data.user.id };
  } catch (error: any) {
    console.error("Error creating patient auth:", error);
    return { success: false, error };
  }
};

export const sendPatientWelcomeEmail = async (
  patientEmail: string,
  patientName: string,
  temporaryPassword: string
) => {
  try {
    const subject = "Welcome to RaDixpert - Your Patient Account";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #10b981; margin-bottom: 5px;">RaDixpert</h1>
          <p style="color: #64748b; font-size: 16px;">Your Radiology Expert</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #334155; margin-bottom: 16px;">Welcome, ${patientName}!</h2>
          <p style="color: #475569; line-height: 1.6;">Your healthcare provider has created an account for you in the RaDixpert system. You can now access your medical reports and chat with your doctors.</p>
          <p style="color: #475569; line-height: 1.6; margin-top: 16px;">Your login details:</p>
          <div style="background-color: #e2e8f0; padding: 12px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 4px 0; font-family: monospace; font-size: 16px;">Email: ${patientEmail}</p>
            <p style="margin: 4px 0; font-family: monospace; font-size: 16px;">Temporary Password: ${temporaryPassword}</p>
          </div>
          <p style="color: #475569; line-height: 1.6;">You'll be asked to change your password when you first log in.</p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://radixpert.com/login/patient" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Your Account</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 14px;">
          <p>If you have any questions, please contact your healthcare provider.</p>
          <p>&copy; ${new Date().getFullYear()} RaDixpert. All rights reserved.</p>
        </div>
      </div>
    `;

    // Call the send-email function
    const response = await fetch(`https://ruueewpswsmmagpsxbvk.supabase.co/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: patientEmail,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send email");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
