import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NotificationStatus } from '@prisma/client';
import { zodEnumTransform } from 'src/common/validators';

const UpdateNotificationStatusSchema = z.object({
  status: zodEnumTransform(NotificationStatus),
});

export class UpdateNotificationStatusDto extends createZodDto(
  UpdateNotificationStatusSchema,
) {
  @ApiProperty({
    enum: Object.values(NotificationStatus).map((v) => v.toLowerCase()),
    example: 'read',
    description: 'Status to update the notification to',
  })
  status: NotificationStatus;
}
