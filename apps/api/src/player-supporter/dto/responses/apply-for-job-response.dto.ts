import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class ApplyForJobResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Application created successfully' })
  declare message: string;
  
  data: {
    applicationId: string;
  };
}
