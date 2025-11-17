import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodMongoId } from 'src/common/validators';

const DeletePlayerParamSchema = z.object({
  id: zodMongoId(),
});

export class DeletePlayerParamDto extends createZodDto(DeletePlayerParamSchema) {
  @ApiProperty({ example: '60f7b3f7c9e77c001f8e6f9a' })
  id: string;
}
