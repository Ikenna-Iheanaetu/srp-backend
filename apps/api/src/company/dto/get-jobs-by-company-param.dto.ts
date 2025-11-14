import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodMongoId } from '../../common/validators';

const GetJobsByCompanyParamsSchema = z.object({
  id: zodMongoId(),
});

export class GetJobsByCompanyParamsDto extends createZodDto(
  GetJobsByCompanyParamsSchema,
) {
  @ApiProperty({
    description: 'The ID of the company',
    example: '60d5f9fbd9b8d6001f8b4567',
  })
  id: string;
}
