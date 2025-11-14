import { z } from "zod";

export const AVAILABLE_SKILLS = [
  "Tactical Awareness",
  "Team Coordination",
  "Technical Skills",
  "Problem Solving",
  "Communication",
];

export const AVAILABLE_TRAITS = [
  "Mental Toughness",
  "Emotional Control",
  "Goal-Oriented",
  "Leadership",
  "Adaptability",
];

export const jobFormSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  employmentType: z.enum(["Full Time", "Part Time", "Contract", "Temporary"]),
  jobDescription: z.string().min(1, "Job description is required"),
  responsibilities: z.string().min(1, "Responsibilities are required"),
  qualifications: z.string().min(1, "Qualifications are required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  traits: z.array(z.string()).min(1, "At least one trait is required"),
  startDate: z.date(),
  datePosted: z.string().optional(),
  compensationMin: z.number().min(0),
  compensationMax: z.number().min(0),
  location: z.string().min(1, "Location is required"),
  visibility: z.boolean(),
  targetClubs: z.array(z.string()).optional(),
  openToAll: z.boolean().default(false),
  targetSpecificClubs: z.boolean().default(false),
  selectedClubs: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .default([]),
  tags: z.array(z.string()).optional(),
});

export type JobFormData = z.infer<typeof jobFormSchema>;

// export const jobFormSchema = z.object({
//   jobTitle: z.string().min(1, "Job title is required"),
//   department: z.string().min(1, "Department is required"),
//   employmentType: z.enum(["Full Time", "Part Time", "Contract", "Temporary"]),
//   jobDescription: z.string().min(1, "Job description is required"),
//   responsibilities: z.string().min(1, "Responsibilities are required"),
//   qualifications: z.string().min(1, "Qualifications are required"),
//   skills: z.array(z.string()).min(1, "At least one skill is required"),
//   traits: z.array(z.string()).min(1, "At least one trait is required"),
//   startDate: z.date(),
//   compensationMin: z.number().min(0),
//   compensationMax: z.number().min(0),
//   location: z.string().min(1, "Location is required"),
//   visibility: z.boolean(),
//   targetClubs: z.array(z.string()).optional(),
//   tags:z.array(z.string()).optional()
// })

// export type JobFormData = z.infer<typeof jobFormSchema>
