import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NotificationStatus } from '@prisma/client';
import { zodEnumTransform } from 'src/common/validators';

const UpdateNotificationStatusBulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: zodEnumTransform(NotificationStatus),
});

export class UpdateNotificationStatusBulkDto extends createZodDto(
  UpdateNotificationStatusBulkSchema,
) {
  @ApiProperty({
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of notification IDs to update',
  })
  ids: string[];

  @ApiProperty({
    enum: Object.values(NotificationStatus).map((v) => v.toLowerCase()),
    example: 'read',
    description: 'Status to update the notifications to',
  })
  status: NotificationStatus;
}
