import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PostPartnerAnswersSchema = z.object({
  answers: z.array(z.string()).min(1),
});

export class PostPartnerAnswersDto extends createZodDto(PostPartnerAnswersSchema) {
  @ApiProperty({
    type: [String],
    description: 'Array of selected answers',
    example: ['A', 'C', 'B', 'D'],
  })
  answers: string[];
}