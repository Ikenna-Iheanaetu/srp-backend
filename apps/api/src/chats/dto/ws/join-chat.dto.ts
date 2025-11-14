import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { zodMongoId } from 'src/common/validators';

const JoinChatSchema = z.object({
  chatId: zodMongoId(),
});

export class JoinChatDto extends createZodDto(JoinChatSchema) {
  chatId: string;
}
