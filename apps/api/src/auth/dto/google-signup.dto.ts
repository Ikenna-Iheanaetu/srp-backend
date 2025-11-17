import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { UserTypeEnum } from 'src/common/dto/user-type.enums.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GoogleSignupSchema = z.object({
  userType: z
    .string()
    .transform((val) => val?.toUpperCase())
    .refine((val) => Object.values(UserTypeEnum).map((v) => v.toUpperCase()).includes(val), {
      message: 'Invalid user type',
    }) as z.ZodType<UserType>,
  authToken: z.string().min(1),
  refCode: z.string().optional(),
});

export class GoogleSignupDto extends createZodDto(GoogleSignupSchema) {
  @ApiProperty({
    description: 'User type',
    enum: UserTypeEnum,
    example: 'player',
  })
  userType: UserType;

  @ApiProperty({
    description: 'Google OAuth token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  authToken: string;

  @ApiProperty({
    description: 'Reference code (required for non-CLUB users)',
    example: 'REF123456',
    required: false,
  })
  refCode?: string;
}
