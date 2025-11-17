import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SaveAffiliateSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
});

export class SaveAffiliateDto extends createZodDto(SaveAffiliateSchema) {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the user (player, supporter, or company) to save/unsave',
  })
  userId: string;

  @ApiProperty({
    example: 'player',
    description: 'The role/type of the affiliate being saved',
  })
  role: string;
}