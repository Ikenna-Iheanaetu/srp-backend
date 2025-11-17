import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';

export class GetClubUpdatesDto extends createZodDto(PaginationQuerySchema) {}