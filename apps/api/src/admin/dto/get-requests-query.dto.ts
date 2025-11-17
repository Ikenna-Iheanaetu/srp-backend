import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { RequestStatus } from '@prisma/client';
import { zodInteger, zodEnumTransform } from 'src/common/validators';

const GetRequestsQuerySchema = z.object({
  page: zodInteger(z.number().int().min(1)).default(1).optional(),
  limit: zodInteger(z.number().int().min(1)).default(10).optional(),
  search: z.string().optional(),
  requestDate: z.string().datetime().optional(),
  status: zodEnumTransform(RequestStatus).optional() as z.ZodOptional<z.ZodType<RequestStatus>>,
});

export class GetRequestsQueryDto extends createZodDto(GetRequestsQuerySchema) {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by request ID, initiator name, or recipient name',
    example: 'MSG_1039',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by request date (ISO 8601 format)',
    example: '2023-12-08',
  })
  requestDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by request status',
    enum: Object.values(RequestStatus).map((v) => v.toLowerCase()),
    example: 'pending',
  })
  status?: RequestStatus;
}
