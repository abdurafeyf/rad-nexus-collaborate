
import { z } from "zod";

// Form schema for patient creation
export const patientFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  dateOfBirth: z.date().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  notes: z.string().optional(),
  xrays: z
    .array(
      z.object({
        date: z.date(),
        file: z.instanceof(File).optional(),
        scanType: z.enum(["X-Ray", "MRI", "CT", "Ultrasound", "Other"]).default("X-Ray"),
      })
    )
    .optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
