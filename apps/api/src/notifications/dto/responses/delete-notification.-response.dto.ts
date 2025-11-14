import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class DeleteNotificationResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Notification deleted successfully' })
  declare message: string;
}