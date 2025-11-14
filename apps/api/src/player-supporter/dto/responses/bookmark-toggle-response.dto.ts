import { ApiProperty } from '@nestjs/swagger';

export class BookmarkToggleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bookmark added successfully' })
  message: string;
}
