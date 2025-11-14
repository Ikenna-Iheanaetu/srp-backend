import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AffiliateType } from '@prisma/client';
import { zodEnumTransform } from 'src/common/validators';

const CreateAffiliateSchema = z.object({
  type: zodEnumTransform(AffiliateType),
  emails: z.array(z.string().min(1)),
});

export class CreateAffiliateDto extends createZodDto(CreateAffiliateSchema) {
  @ApiProperty({
    enum: Object.values(AffiliateType).map((v) => v.toLowerCase()),
    example: 'player',
    description: 'Type of affiliate (player, supporter, company, club)',
  })
  type: AffiliateType;

  @ApiProperty({
    type: [String],
    example: ['player@example.com', 'supporter@example.com'],
    description: 'Array of email addresses to send affiliate invitations',
  })
  emails: string[];
}