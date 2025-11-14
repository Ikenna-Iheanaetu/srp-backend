import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodMongoId } from 'src/common/validators';

const RemoveShortlistedPlayerSchema = z.object({
  candidate: zodMongoId(),
  jobs: z.array(zodMongoId()),
});

export class RemoveShortlistedPlayerDto extends createZodDto(
  RemoveShortlistedPlayerSchema,
) {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Player/candidate ID',
  })
  candidate: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    description: 'Array of job IDs',
  })
  jobs: string[];
}