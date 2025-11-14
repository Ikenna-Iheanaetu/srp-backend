
export interface CompanyFiles {
  avatar?: Express.Multer.File[];
  secondaryAvatar?: Express.Multer.File[];
  banner?: Express.Multer.File[];
}


export interface ProcessedCompanyFiles {
  avatar?: Express.Multer.File;
  secondaryAvatar?: Express.Multer.File;
  banner?: Express.Multer.File;
}
