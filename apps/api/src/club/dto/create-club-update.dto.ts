import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateClubUpdateSchema = z.object({
  message: z.string().min(1),
});

export class CreateClubUpdateDto extends createZodDto(CreateClubUpdateSchema) {
  @ApiProperty({
    example:
      'Exciting news! We have a new training schedule starting next week.',
    description: 'The update message to send to all club affiliates',
  })
  message: string;
}