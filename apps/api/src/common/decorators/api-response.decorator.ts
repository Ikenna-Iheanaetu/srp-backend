import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

export const ApiResponseDecorator = <T>(
  status: number,
  description: string,
  type?: Type<T>,
) => {
  return applyDecorators(
    SwaggerApiResponse({
      status,
      description,
      type, // Let NestJS handle the schema generation automatically
    }),
  );
};
