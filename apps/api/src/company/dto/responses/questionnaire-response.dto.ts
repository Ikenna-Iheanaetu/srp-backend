import { ApiProperty } from '@nestjs/swagger';

export class PartnerQuestionItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  question: string;

  @ApiProperty({ type: [String] })
  options: string[];
}

export class PartnerQuestionsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Questions fetched successfully' })
  message: string;

  @ApiProperty({ type: [PartnerQuestionItemDto] })
  data: PartnerQuestionItemDto[];
}

export class PartnerAnswerResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Submitted successfully' })
  message: string;

  @ApiProperty({ example: '85 %' })
  data: { score: string };
}


