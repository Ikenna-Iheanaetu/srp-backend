import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMessagesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ default: 50 })
  limit?: number = 50;
}
