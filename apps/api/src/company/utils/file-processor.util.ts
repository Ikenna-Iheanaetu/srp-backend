import { CompanyFiles, ProcessedCompanyFiles } from '../types/files.types';

export class FileProcessorUtil {
  /**
   * Extract and process files from Multer upload for company
   * @param files Raw files from Multer
   * @returns Processed files for service layer
   */
  static extractFiles(files?: CompanyFiles): ProcessedCompanyFiles {
    if (!files) return {};

    return {
      avatar: files.avatar?.[0],
      secondaryAvatar: files.secondaryAvatar?.[0],
      banner: files.banner?.[0],
    };
  }

  /**
   * Validate file types for company uploads
   * @param files Processed files to validate
   * @returns true if all files are valid, false otherwise
   */
  static validateFileTypes(files: ProcessedCompanyFiles): boolean {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (files.avatar && !allowedImageTypes.includes(files.avatar.mimetype)) {
      return false;
    }

    if (
      files.secondaryAvatar &&
      !allowedImageTypes.includes(files.secondaryAvatar.mimetype)
    ) {
      return false;
    }

    if (files.banner && !allowedImageTypes.includes(files.banner.mimetype)) {
      return false;
    }

    return true;
  }

  /**
   * Get file size in MB
   * @param file File to get size for
   * @returns Size in MB
   */
  static getFileSizeMB(file: Express.Multer.File): number {
    return file.size / (1024 * 1024);
  }

  /**
   * Validate file sizes (max 5MB per file)
   * @param files Processed files to validate
   * @returns true if all files are within size limit
   */
  static validateFileSizes(
    files: ProcessedCompanyFiles,
    maxSizeMB = 5,
  ): boolean {
    const filesToCheck = [
      files.avatar,
      files.secondaryAvatar,
      files.banner,
    ].filter(Boolean);

    return filesToCheck.every((file) => this.getFileSizeMB(file!) <= maxSizeMB);
  }
}
