export interface PlayerFiles {
  avatar?: Express.Multer.File[];
  resume?: Express.Multer.File[];
  certifications0?: Express.Multer.File[];
  certifications1?: Express.Multer.File[];
  certifications2?: Express.Multer.File[];
  certifications3?: Express.Multer.File[];
  certifications4?: Express.Multer.File[];
}

export interface ProcessedPlayerFiles {
  avatar?: Express.Multer.File;
  banner?: Express.Multer.File;
  resume?: Express.Multer.File;
  certifications?: Express.Multer.File[];
}

export interface JobApplicationFiles {
  resume?: Express.Multer.File[];
  applicationLetter?: Express.Multer.File[];
}

export interface ProcessedJobApplicationFiles {
  resume?: Express.Multer.File;
  applicationLetter?: Express.Multer.File;
}