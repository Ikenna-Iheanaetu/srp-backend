import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { UserTypeEnum } from 'src/common/dto/user-type.enums.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SignupSchema = z.object({
  name: z.string().min(1),
  userType: z
    .string()
    .transform((val) => val?.toUpperCase())
    .refine((val) => Object.values(UserTypeEnum).map((v) => v.toUpperCase()).includes(val), {
      message: 'Invalid user type',
    }) as z.ZodType<UserType>,
  email: z.string().email(),
  password: z.string().min(1),
  refCode: z.string().optional(),
});

export class SignupDto extends createZodDto(SignupSchema) {
  @ApiProperty({ example: 'Acme Inc.' })
  name: string;

  @ApiProperty({
    enum: UserTypeEnum,
    enumName: 'SignupUserType',
    example: 'player',
  })
  userType: UserType;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  password: string;

  @ApiPropertyOptional({ example: '123456' })
  refCode?: string;
}
