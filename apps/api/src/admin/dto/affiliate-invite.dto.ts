import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateInviteSchema = z.object({
  status: z.enum(['approved', 'declined']),
});

export class UpdateInviteDto extends createZodDto(UpdateInviteSchema) {
  @ApiProperty({
    example: 'approved',
    enum: ['approved', 'declined'],
    description: 'Status to update the invite to',
  })
  status: 'approved' | 'declined';
}

