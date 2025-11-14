import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodEnumTransform } from 'src/common/validators';
import { UserStatus } from '@prisma/client';

export enum MetricsPeriod {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_WEEK = 'LAST_WEEK',
  LAST_MONTH = 'LAST_MONTH',
  LAST_YEAR = 'LAST_YEAR',
}

const GetDashboardQuerySchema = z.object({
  period: zodEnumTransform(MetricsPeriod).default(MetricsPeriod.LAST_WEEK).optional() as z.ZodOptional<z.ZodType<MetricsPeriod>>,
  hireHistoryPage: z.string().regex(/^\d+$/).transform(val => Number(val)).optional(),
  hireHistoryLimit: z.string().regex(/^\d+$/).transform(val => Number(val)).optional(),
  hireHistorySearch: z.string().optional(),
  hireHistoryHiredAt: z.string().datetime().optional(),
  newCompaniesPage: z.string().regex(/^\d+$/).transform(val => Number(val)).optional(),
  newCompaniesLimit: z.string().regex(/^\d+$/).transform(val => Number(val)).optional(),
  newCompaniesSearch: z.string().optional(),
  newCompaniesSignupDate: z.string().datetime().optional(),
  newCompaniesStatus: zodEnumTransform(UserStatus).optional() as z.ZodOptional<z.ZodType<UserStatus>>,
});

export class GetDashboardQueryDto extends createZodDto(GetDashboardQuerySchema) {
  @ApiPropertyOptional({
    description: 'Period for metrics',
    enum: Object.values(MetricsPeriod).map((v) => v.toLowerCase()),
    example: 'last_week',
    default: 'last_week',
  })
  period?: MetricsPeriod = MetricsPeriod.LAST_WEEK;

  @ApiPropertyOptional({
    description: 'Page number for hire history',
    example: 1,
  })
  hireHistoryPage?: number;

  @ApiPropertyOptional({
    description: 'Items per page for hire history',
    example: 10,
  })
  hireHistoryLimit?: number;

  @ApiPropertyOptional({
    description: 'Search for hire history',
    example: 'John',
  })
  hireHistorySearch?: string;

  @ApiPropertyOptional({
    description: 'Filter hire history by hire date',
    example: '2023-12-08',
  })
  hireHistoryHiredAt?: string;

  @ApiPropertyOptional({
    description: 'Page number for new companies',
    example: 1,
  })
  newCompaniesPage?: number;

  @ApiPropertyOptional({
    description: 'Items per page for new companies',
    example: 10,
  })
  newCompaniesLimit?: number;

  @ApiPropertyOptional({
    description: 'Search for new companies',
    example: 'Elite Match',
  })
  newCompaniesSearch?: string;

  @ApiPropertyOptional({
    description: 'Filter new companies by signup date',
    example: '2023-12-08',
  })
  newCompaniesSignupDate?: string;

  @ApiPropertyOptional({
    description: 'Filter new companies by status',
    enum: Object.values(UserStatus).map((v) => v.toLowerCase()),
    example: 'pending',
  })
  newCompaniesStatus?: UserStatus;
}

