import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';

export class ClubMiniDto {
  @ApiProperty({ example: '68c02dec6759f60fe9213820' })
  id: string;

  @ApiProperty({ example: 'Sports Club 3' })
  name: string;

  @ApiProperty({
    example: 'https://ui-avatars.com/api/?name=Club3&background=random',
    nullable: true,
  })
  avatar?: string | null;
}

export class CompanyItemDto {
  @ApiProperty({ example: '68c02dfc6759f60fe9213837' })
  id: string;

  @ApiProperty({ example: 'TechCorp 8' })
  name: string;

  @ApiProperty({
    example: 'Leading Entertainment company with innovative solutions',
    nullable: true,
  })
  about?: string | null;

  @ApiProperty({
    example: 'https://ui-avatars.com/api/?name=Tech8&background=random',
    nullable: true,
  })
  avatar?: string | null;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2025-09-09T13:39:08.747Z' })
  createdAt: Date;

  @ApiProperty({ example: 2 })
  employeesCount: number;

  @ApiProperty({ type: ClubMiniDto, nullable: true })
  club?: ClubMiniDto | null;
}

export class CompanyDataWrapperDto {
  @ApiProperty({ type: [CompanyItemDto] })
  companyList: CompanyItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class CompanyListResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Companies fetched successfully' })
  declare message: string;

  @ApiProperty({ type: CompanyDataWrapperDto })
  data: {
    data: CompanyItemDto[];
    meta: PaginationMetaDto;
  };
}
