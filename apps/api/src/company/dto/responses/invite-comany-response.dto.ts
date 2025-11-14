import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class InviteCompanyDataDto {
  @ApiProperty({ example: ['ceo@acme.com'] })
  processedEmails: string[];

  @ApiProperty({
    example: [{ email: 'skip@acme.com', reason: 'Already invited' }],
  })
  skippedEmails: { email: string; reason: string }[];
}

export class InviteCompanyResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Company invitation(s) sent successfully.' })
  declare message: string;

  @ApiProperty({ type: InviteCompanyDataDto })
  data: InviteCompanyDataDto;
}
