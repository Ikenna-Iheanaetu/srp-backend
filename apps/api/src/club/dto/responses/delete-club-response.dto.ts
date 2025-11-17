import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class DeleteClubResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Club and all related data deleted successfully' })
  declare message: string;
}
