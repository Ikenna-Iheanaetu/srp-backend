import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodMongoId } from 'src/common/validators';

const InviteCompanySchema = z.object({
  emails: z
    .union([z.array(z.string().email()), z.string().email()])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .pipe(z.array(z.string().email())),
  clubId: zodMongoId(),
});

export class InviteCompanyDto extends createZodDto(InviteCompanySchema) {
  @ApiProperty({ example: ['ceo@acme.com', 'hr@acme.com'] })
  emails: string[];

  @ApiProperty({ example: '60f7b3f7c9e77c001f8e6f9a' })
  clubId: string;
}
