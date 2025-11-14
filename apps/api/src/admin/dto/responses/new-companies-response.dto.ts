import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class NewCompanyItemDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820' })
  id: string;

  @ApiProperty({ example: 'John Fredrick' })
  name: string;

  @ApiProperty({ example: 'john@elitematch.com' })
  email: string;

  @ApiProperty({ example: 'Marine Engineer' })
  industry: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: '2023-12-08' })
  signupDate: string;
}

export class NewCompaniesDataDto {
  @ApiProperty({ type: [NewCompanyItemDto] })
  data: NewCompanyItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class GetNewCompaniesResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'New companies fetched successfully' })
  declare message: string;

  @ApiProperty({ type: NewCompaniesDataDto })
  data: NewCompaniesDataDto;
}
