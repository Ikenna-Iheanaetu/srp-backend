import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetSuggestedProfilesForUserParamsSchema = z.object({
  id: z.string().min(1),
});

export class GetSuggestedProfilesForUserParamsDto extends createZodDto(GetSuggestedProfilesForUserParamsSchema) {
  @ApiProperty({ description: 'The ID of the user' })
  id: string;
}
