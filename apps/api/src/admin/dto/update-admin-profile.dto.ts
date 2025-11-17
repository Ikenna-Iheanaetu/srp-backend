import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateAdminProfileSchema = z.object({
  name: z.string().optional(),
  securityQuestion_question: z.string().optional(),
  securityQuestion_answer: z.string().optional(),
});

export class UpdateAdminProfileDto extends createZodDto(
  UpdateAdminProfileSchema,
) {
  @ApiPropertyOptional({ example: 'Super Admin' })
  name?: string;

  @ApiPropertyOptional({ example: 'Fav color?' })
  securityQuestion_question?: string;

  @ApiPropertyOptional({ example: 'Blue' })
  securityQuestion_answer?: string;
}
