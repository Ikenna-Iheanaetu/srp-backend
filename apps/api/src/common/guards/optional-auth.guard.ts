import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

/**
 * Optional Auth Guard
 * Extends AuthGuard but doesn't throw errors if authentication fails.
 * Useful for routes that are public but want to track authenticated users.
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to authenticate using parent AuthGuard
      return await super.canActivate(context);
    } catch (error) {
      // If authentication fails, just continue without setting user
      return true;
    }
  }
}
