import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreateJobSchema } from './create-job.dto';

const UpdateJobSchema = CreateJobSchema.partial().extend({
  status: z
    .string()
    .transform((value) => {
      if (value === '' || value === undefined) return undefined;
      if (typeof value === 'string') return value.toUpperCase();
      return value;
    })
    .refine(
      (val) => !val || Object.values(JobStatus).includes(val as JobStatus),
      { message: 'Status must be one of: DRAFT, ACTIVE, INACTIVE' },
    )
    .optional(),
});

export class UpdateJobDto extends createZodDto(UpdateJobSchema) {
  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Job status',
    enum: Object.values(JobStatus),
  })
  status?: JobStatus;
}