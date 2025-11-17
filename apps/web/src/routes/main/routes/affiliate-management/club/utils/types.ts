// For the applicant object
interface Applicant {
  id: string;
  name: string;
  title: string;
  status: "accepted" | "pending";
  matchPercentage: number;
}

// For the job posting schema
export interface JobPosting {
  jobTitle: string;
  datePosted: string;
  status: string;
  department: string;
  employmentType: "Full Time" | "Part Time" | "Contract" | "Temporary";
  jobDescription: string;
  responsibilities: string;
  qualifications: string;
  skills: string[];
  traits: string[];
  startDate: string;
  compensationMin: number;
  compensationMax: number;
  location: string;
  visibility: boolean;
  targetClubs?: string[];
  openToAll: boolean;
  targetSpecificClubs: boolean;
  selectedClubs: { id: string; name: string }[];
  tags?: string[];
  applicants: Applicant[]; // Array of applicants for each job posting
}

export type TimeInterval = "12 months" | "30 days" | "7 days" | "24 hours";

export interface FilterOption {
  label: string;
  value: string;
}
