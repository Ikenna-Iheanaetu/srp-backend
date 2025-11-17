import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodBoolean, zodInteger } from 'src/common/validators';

const ApplyForJobSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  zip: z.string().min(1),
  legallyAuthorized: zodBoolean(),
  visaSponsorship: zodBoolean(),
  yearsOfExperience: zodInteger(z.number().int().min(0).max(50)).optional(),
});

export class ApplyForJobDto extends createZodDto(ApplyForJobSchema) {
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '1234567890' })
  phone: string;

  @ApiProperty({ example: '12345' })
  zip: string;

  @ApiProperty({ example: true })
  legallyAuthorized: boolean;

  @ApiProperty({ example: false })
  visaSponsorship: boolean;

  @ApiProperty({ example: 5, minimum: 0, maximum: 50 })
  yearsOfExperience?: number;
}
