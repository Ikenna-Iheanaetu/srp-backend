import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NotificationStatus } from '@prisma/client';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { zodQueryArrayToUppercase } from 'src/common/validators';

const GetNotificationsSchema = PaginationQuerySchema.extend({
  status: zodQueryArrayToUppercase(NotificationStatus).optional(),
  search: z.string().optional(),
});

export class GetNotificationsDto extends createZodDto(GetNotificationsSchema) {
  @ApiPropertyOptional({
    type: [String],
    enum: Object.values(NotificationStatus).map((v) => v.toLowerCase()),
    example: ['unread', 'read'],
    description:
      'Filter by notification status (can be multiple). Use ?status[]=read&status[]=unread',
    isArray: true,
  })
  status?: NotificationStatus[];

  @ApiPropertyOptional({
    example: 'job application',
    description: 'Search in title and message',
  })
  search?: string;
}
