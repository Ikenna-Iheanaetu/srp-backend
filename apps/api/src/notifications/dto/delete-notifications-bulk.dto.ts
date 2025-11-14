import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DeleteNotificationsBulkSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export class DeleteNotificationsBulkDto extends createZodDto(
  DeleteNotificationsBulkSchema,
) {
  @ApiProperty({
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of notification IDs to delete',
  })
  ids: string[];
}
