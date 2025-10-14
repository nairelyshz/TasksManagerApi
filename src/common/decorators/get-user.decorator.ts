import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/auth/entities/user.entity';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
