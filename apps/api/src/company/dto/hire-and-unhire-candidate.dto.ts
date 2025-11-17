import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodMongoId } from 'src/common/validators';

const HireCandidateSchema = z.object({
  job: zodMongoId(),
  candidate: zodMongoId(),
});

export class HireCandidateDto extends createZodDto(HireCandidateSchema) {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Job ID' })
  job: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Candidate ID',
  })
  candidate: string;
}
