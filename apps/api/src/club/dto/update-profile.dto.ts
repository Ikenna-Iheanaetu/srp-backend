import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ClubCompleteProfileSchema } from './club-complete-profile.dto';

const UpdateProfileSchema = ClubCompleteProfileSchema.omit({
  step: true,
}).extend({
  name: z.string().min(1).optional(),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {
  @ApiPropertyOptional({ example: 'Manchester United FC' })
  name?: string;
}