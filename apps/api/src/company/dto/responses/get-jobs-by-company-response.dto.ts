import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

class SimpleJobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  location: string;
}

class CompanyInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar: string;
}

class GetJobsByCompanyDataDto {
  @ApiProperty({ type: [SimpleJobDto] })
  data: SimpleJobDto[];

  @ApiProperty()
  meta: PaginationMetaDto;

  @ApiProperty({ type: CompanyInfoDto })
  company: CompanyInfoDto;
}

export class GetJobsByCompanyResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Jobs fetched successfully' })
  declare message: string;

  @ApiProperty({ type: GetJobsByCompanyDataDto })
  data: GetJobsByCompanyDataDto;
}