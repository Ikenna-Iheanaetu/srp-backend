import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import * as crypto from 'crypto';

@Injectable()
export class CodeGeneratorService {
  private readonly refGen = customAlphabet('0123456789', 6);

  generateUniqueRefCode(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomInt(1000, 9999).toString();
    return `${timestamp}${random}`.toUpperCase();
  }
}
