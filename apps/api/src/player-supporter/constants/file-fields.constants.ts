export const PLAYER_FILE_FIELDS = [
  { name: 'avatar', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  // Generate certification fields (0-9 should cover most cases)
  ...Array.from({ length: 4 }, (_, i) => ({
    name: `certifications${i}`,
    maxCount: 1,
  })),
];

export const JOB_APPLICATION_FILE_FIELDS = [
  { name: 'resume', maxCount: 1 },
  { name: 'applicationLetter', maxCount: 1 },
];
