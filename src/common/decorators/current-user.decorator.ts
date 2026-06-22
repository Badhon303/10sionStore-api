import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  sub: string;
  email: string;
  role: string;
  type: 'merchant' | 'employee';
  storeId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
