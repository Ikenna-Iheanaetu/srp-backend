import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const InviteClubSchema = z.object({
  emails: z.array(z.string().email()),
});

export class InviteClubDto extends createZodDto(InviteClubSchema) {
  @ApiProperty({ example: ['admin@sportsclub.com', 'manager@club.com'] })
  emails: string[];
}
