import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

class ClubForCompanyDto {
  @ApiProperty({ example: 'clt42v9v1000008l329t851l7' })
  id: string;

  @ApiProperty({ example: 'Manchester United' })
  name: string;

  @ApiProperty({ example: 'https://example.com/avatar.png' })
  avatar: string;

  @ApiProperty({ example: 'https://example.com/banner.png' })
  banner: string;

  @ApiProperty({ example: '#DA291C' })
  preferredColor: string;
}

export class CompanyForPlayerDto {
  @ApiProperty({ example: 'clt42v9v1000008l329t851l7' })
  id: string;

  @ApiProperty({ example: 'Tech Solutions Inc.' })
  name: string;

  @ApiProperty({ example: 'TECHNOLOGY' })
  industry: string;

  @ApiProperty({ example: 'https://example.com/avatar.png' })
  avatar: string;

  @ApiProperty({ example: 'https://example.com/secondary-avatar.png' })
  secondaryAvatar: string;

  @ApiProperty({ example: "company"})
  userType: string;

  @ApiProperty({ type: () => ClubForCompanyDto, nullable: true })
  club: ClubForCompanyDto | null;
}

export class GetCompaniesForPlayerResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Companies fetched successfully' })
  declare  message: string;

  @ApiProperty({ type: () => [CompanyForPlayerDto] })
  data: {
    data: CompanyForPlayerDto[];
    meta: PaginationMetaDto;
  };
}
