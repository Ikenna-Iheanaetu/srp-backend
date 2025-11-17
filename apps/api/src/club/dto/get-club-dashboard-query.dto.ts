import { ApiPropertyOptional } from "@nestjs/swagger";
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export enum ClubDashboardPeriod {
  TODAY = "today",
  YESTERDAY = "yesterday", 
  LAST_WEEK = "last_week",
  LAST_MONTH = "last_month",
  LAST_YEAR = "last_year",
}

const GetClubDashboardQuerySchema = z.object({
  period: z.preprocess(
    (val) => typeof val === 'string' ? val.toLowerCase() : val,
    z.nativeEnum(ClubDashboardPeriod, { message: 'Invalid dashboard period' })
  ).default(ClubDashboardPeriod.LAST_WEEK).optional(),
});

export class GetClubDashboardQueryDto extends createZodDto(GetClubDashboardQuerySchema) {
  @ApiPropertyOptional({
    description: 'Period for dashboard metrics',
    enum: Object.values(ClubDashboardPeriod),
    example: 'last_week',
    default: 'last_week',
  })
  period?: ClubDashboardPeriod = ClubDashboardPeriod.LAST_WEEK;
}
