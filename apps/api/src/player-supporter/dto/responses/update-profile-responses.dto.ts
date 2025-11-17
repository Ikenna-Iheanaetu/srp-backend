import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class UpdateProfileResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Profile updated successfully' })
  declare message: string;
}
