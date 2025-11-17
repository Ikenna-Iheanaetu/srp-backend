import { EmploymentType } from '@prisma/client';

export type EmploymentTypeJson = {
  primary: EmploymentType;
  secondary?: EmploymentType[];
};
