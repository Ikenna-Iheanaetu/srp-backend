import { Logger } from '@nestjs/common';

/**
 * Decorator to ensure WebSocket handlers are only executed for authenticated users
 *
 * Usage:
 * @WsAuthenticated()
 * @SubscribeMessage('chat:join')
 * async handleJoinChat(...) { ... }
 *
 * This decorator checks if client.data.user exists before allowing the handler to execute.
 * If not authenticated, it returns an error response and logs the unauthorized attempt.
 */
export function WsAuthenticated() {
  const logger = new Logger('WsAuthenticated');

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // First argument is always the Socket client for @ConnectedSocket()
      const client = args[0];

      // Check if user is authenticated
      if (!client?.data?.user?.userId) {
        const socketId = client?.id || 'unknown';
        const ip = client?.handshake?.address || 'unknown';

        logger.warn(
          `Unauthorized ${propertyKey} attempt - Socket: ${socketId}, IP: ${ip}`,
        );

        // Return error response in WebSocket format
        return {
          error: 'Unauthorized - authentication required',
          statusCode: 401,
          code: 'UNAUTHORIZED',
        };
      }

      // User is authenticated - proceed with original method
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
