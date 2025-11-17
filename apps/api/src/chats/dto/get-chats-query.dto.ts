import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

export enum ReadStatus {
  READ = 'READ',
  UNREAD = 'UNREAD',
}

const GetChatsQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(ReadStatus).optional(),
  search: z.string().optional(),
});

export class GetChatsQueryDto extends createZodDto(GetChatsQuerySchema) {
  @ApiPropertyOptional({
    enum: ReadStatus,
    description: 'Filter by read status (READ or UNREAD)'
  })
  status?: ReadStatus;

  @ApiPropertyOptional({
    description: 'Search by participant name'
  })
  search?: string;
}
