import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Useragent = createParamDecorator((_: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'];
});
