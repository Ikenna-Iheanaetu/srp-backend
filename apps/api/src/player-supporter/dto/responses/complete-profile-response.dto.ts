import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class CompleteProfileResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Step 1 completed successfully' })
  declare message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      onboardingSteps: { type: 'array', items: { type: 'number' } },
      completedStep: { type: 'number' },
      isOnboardingComplete: { type: 'boolean' },
      nextStep: { type: 'number', nullable: true },
    },
  })
  data: {
    onboardingSteps: number[];
    completedStep: number;
    isOnboardingComplete: boolean;
    nextStep: number | null;
  };
}
