import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

class SkippedEmail {
  @ApiProperty({ example: 'player@example.com' })
  email: string;

  @ApiProperty({ example: 'An account with this email already exists.' })
  reason: string;
}

export class CreateAffiliateResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Affiliate requests sent successfully' })
  declare message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      processedEmails: {
        type: 'array',
        items: { type: 'string' },
        example: ['player@example.com', 'supporter@example.com'],
      },
      skippedEmails: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            reason: { type: 'string' },
          },
        },
      },
    },
  })
  data: {
    processedEmails: string[];
    skippedEmails: SkippedEmail[];
  };
}