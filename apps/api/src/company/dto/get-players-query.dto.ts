import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from 'src/common/dto/pagination-query.dto';
import { zodQueryArray, zodQueryArrayToUppercase } from 'src/common/validators';
import { UserType } from '@prisma/client';

const GetPlayersQuerySchema = PaginationQuerySchema.extend({
  regions: zodQueryArray(z.string()).optional(),
  candidates: zodQueryArrayToUppercase(UserType).optional(),
  workTypes: zodQueryArray(z.string()).optional(),
  clubTypes: zodQueryArray(z.string()).optional(),
  clubs: zodQueryArray(z.string()).optional(),
  industry: zodQueryArray(z.string()).optional(),
  search: z.string().optional(),
});

export class GetPlayersQueryDto extends createZodDto(GetPlayersQuerySchema) {
  @ApiPropertyOptional({
    example: ['North America', 'Europe'],
    description:
      'Filter by regions. Accepts both single values and arrays. Supports both ?regions=value and ?regions[]=value notation.',
  })
  regions?: string[];

  @ApiPropertyOptional({
    example: ['player', 'supporter'],
    description:
      'Filter by candidate types (player, supporter). Values are transformed to uppercase. Supports both ?candidates=value and ?candidates[]=value notation.',
    enum: ['player', 'supporter'],
  })
  candidates?: string[];

  @ApiPropertyOptional({
    example: ['full-time', 'part-time'],
    description:
      'Filter by work types. Accepts both single values and arrays. Supports both ?workTypes=value and ?workTypes[]=value notation.',
  })
  workTypes?: string[];

  @ApiPropertyOptional({
    example: ['professional', 'amateur'],
    description:
      'Filter by club types. Accepts both single values and arrays. Supports both ?clubTypes=value and ?clubTypes[]=value notation.',
  })
  clubTypes?: string[];

  @ApiPropertyOptional({
    example: ['club1', 'club2'],
    description:
      'Filter by club IDs. Accepts both single values and arrays. Supports both ?clubs=value and ?clubs[]=value notation.',
  })
  clubs?: string[];

  @ApiPropertyOptional({
    example: ['Sports Technology', 'Healthcare'],
    description:
      'Filter by industry. Accepts both single values and arrays. Supports both ?industry=value and ?industry[]=value notation.',
  })
  industry?: string[];

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Search term for name, about, skills, etc.',
  })
  search?: string;
}
