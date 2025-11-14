import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType as UserTypeEnum } from '@prisma/client';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredUserTypes = this.reflector.getAllAndOverride<UserTypeEnum[]>(
      'userType',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredUserTypes) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const hasUserType = requiredUserTypes.includes(user.userType);
    if (!hasUserType) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
