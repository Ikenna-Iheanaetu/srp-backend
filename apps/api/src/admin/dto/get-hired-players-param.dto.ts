import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetHiredPlayersParamsSchema = z.object({
  id: z.string().min(1),
});

export class GetHiredPlayersParamsDto extends createZodDto(
  GetHiredPlayersParamsSchema,
) {
  @ApiProperty({ example: '60f7b3f7c9e77c001f8e6f9a' })
  id: string;
}
