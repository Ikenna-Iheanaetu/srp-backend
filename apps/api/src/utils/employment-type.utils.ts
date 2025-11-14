export function mapEmploymentType(prismaType: string): string {
  const typeMap: Record<string, string> = {
    FREELANCE: 'freelance',
    PART_TIME: 'part-time',
    FULL_TIME: 'full-time',
    CONTRACT: 'contract',
    INTERNSHIP: 'internship',
    FIXED_TERM: 'fixed-term',
    PERMANENT: 'permanent',
    TEMPORARY: 'temporary',
    SEASONAL: 'seasonal',
    HOURLY: 'hourly',
    PROJECT_BASED: 'project-based',
    PROBATIONARY: 'probationary',
  };

  return typeMap[prismaType] || prismaType.toLowerCase();
}
