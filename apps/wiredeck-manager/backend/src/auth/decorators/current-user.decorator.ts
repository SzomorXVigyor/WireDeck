import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

// Create a custom decorator to get the current user from the request object

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const user = context.switchToHttp().getRequest().user;
  if (!user) {
    throw new InternalServerErrorException('No user found on request object!');
  }
  return user;
});

export const CurrentUserOptional = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest().user ?? null;
});
