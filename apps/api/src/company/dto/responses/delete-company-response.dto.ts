import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class DeleteCompanyResponseDto extends BaseResponseDto{
  @ApiProperty({ example: 'Company and all related data deleted successfully' })
  declare message: string;
}
