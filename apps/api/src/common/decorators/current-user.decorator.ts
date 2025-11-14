// decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  profileId: string;
  email: string;
  userType: string;
  status: string;
  jti: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    // If a specific field is requested, return only that field
    if (data) {
      return user?.[data];
    }

    // Otherwise, return the entire user object
    return user;
  },
);
