import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CompanyCompleteProfileSchema } from './complete-profile.dto';
import { zodStringArray } from 'src/common/validators';

const UpdateProfileSchema = CompanyCompleteProfileSchema.omit({
  step: true,
}).extend({
  name: z.string().min(1).optional(),
  focus: z.string().optional(),
  preferredClubs: zodStringArray(z.string()).optional(),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {
  @ApiPropertyOptional({ example: 'Tech Sports Inc.' })
  name?: string;

  @ApiPropertyOptional({ example: 'Player Development' })
  focus?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Club A', 'Club B'],
    description: 'List of preferred clubs',
  })
  preferredClubs?: string[];
}
