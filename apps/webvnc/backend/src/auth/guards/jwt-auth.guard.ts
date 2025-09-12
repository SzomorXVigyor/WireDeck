import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Check for token in query parameter if not in header
    if (!request.headers.authorization && request.query.token) {
      request.headers.authorization = `Bearer ${request.query.token}`;
    }

    return request;
  }
}
