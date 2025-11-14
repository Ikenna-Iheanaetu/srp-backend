import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class InviteClubDataDto {
  @ApiProperty({ example: ['admin@sportsclub.com'] })
  processedEmails: string[];

  @ApiProperty({
    example: [{ email: 'skip@club.com', reason: 'Already invited' }],
  })
  skippedEmails: { email: string; reason: string }[];
}

export class InviteClubResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Club invitation(s) sent successfully' })
  declare message: string;

  @ApiProperty({ type: InviteClubDataDto })
  data: InviteClubDataDto;
}
