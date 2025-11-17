import { JobApplicationFiles, PlayerFiles, ProcessedJobApplicationFiles, ProcessedPlayerFiles } from '../types/files.types';

export class FileProcessorUtil {
  static extractFiles(files?: PlayerFiles): ProcessedPlayerFiles {
    if (!files) return {};

    const certifications: Express.Multer.File[] = [];

    // Extract certification files
    Object.entries(files).forEach(([key, fileArray]) => {
      if (key.startsWith('certifications') && fileArray?.[0]) {
        certifications.push(fileArray[0]);
      }
    });

    return {
      avatar: files.avatar?.[0],
      resume: files.resume?.[0],
      certifications: certifications.length > 0 ? certifications : undefined,
    };
  }

  static extractJobApplicationFiles(
    files?: JobApplicationFiles,
  ): ProcessedJobApplicationFiles {
    if (!files) return {};

    return {
      resume: files.resume?.[0],
      applicationLetter: files.applicationLetter?.[0],
    };
  }

  static validateFileTypes(files: ProcessedPlayerFiles): boolean {
    // Add your file type validation logic here
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (files.avatar && !allowedImageTypes.includes(files.avatar.mimetype)) {
      return false;
    }

    if (files.banner && !allowedImageTypes.includes(files.banner.mimetype)) {
      return false;
    }

    if (files.resume && !allowedDocTypes.includes(files.resume.mimetype)) {
      return false;
    }

    return true;
  }
}
