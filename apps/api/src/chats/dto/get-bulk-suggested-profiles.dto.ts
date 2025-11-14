import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetBulkSuggestedProfilesSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID must be provided').max(50, 'Cannot fetch more than 50 profiles at once'),
});

export class GetBulkSuggestedProfilesDto extends createZodDto(GetBulkSuggestedProfilesSchema) {
  @ApiProperty({
    description: 'Array of user IDs to fetch suggested profiles for',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'],
    minItems: 1,
    maxItems: 50,
  })
  ids: string[];
}
