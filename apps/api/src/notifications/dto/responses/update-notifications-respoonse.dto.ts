import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class UpdateNotificationStatusResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Notification status updated successfully' })
  declare message: string;
}
