import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
    Post,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { LoginDTO, RegisterDTO } from './dto';
import { AuthService } from './auth.service';
import { Tokens } from './interfaces';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Cookie, Public, Useragent } from '@common/decorators';
import { UserResponse } from '@user/responses';
import { GoogleGuard } from './guards/google.guard';
import { HttpService } from '@nestjs/axios';
import { map, mergeMap } from 'rxjs';
import { handleTimeoutAndErrors } from '@common/helpers';
import { YandexGuard } from './guards/yandex.guard';
import { Provider } from '@prisma/client';

const REFRESH_TOKEN = 'refreshtoken';
@Public()
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly confugService: ConfigService,
        private readonly httpService: HttpService,
    ) {}

    @UseInterceptors(ClassSerializerInterceptor)
    @Post('register')
    async register(@Body() dto: RegisterDTO) {
        const user = await this.authService.register(dto);
        if (!user) {
            throw new BadRequestException(
                `Неполучается зарегистрировать пользователя с данными: ${JSON.stringify(dto)}`,
            );
        }
        return new UserResponse(user);
    }

    @Post('login')
    async login(@Body() dto: LoginDTO, @Res() res: Response, @Useragent() agent: string) {
        const tokens = await this.authService.login(dto, agent);
        if (!tokens) {
            throw new BadRequestException(`Не получается войти с данными: ${JSON.stringify(dto)}`);
        }
        this.setRefreshTokenToCookies(tokens, res);
    }

    @Get('logout')
    async logout(@Cookie(REFRESH_TOKEN) refreshToken: string, @Res() res: Response) {
        if (!refreshToken) {
            res.sendStatus(HttpStatus.OK);
            return;
        }
        await this.authService.deleteRefreshToken(refreshToken);
        res.cookie(REFRESH_TOKEN, '', { httpOnly: true, secure: true, expires: new Date() });
        res.sendStatus(HttpStatus.OK);
    }

    @Get('refresh-tokens')
    async refreshTokens(@Cookie(REFRESH_TOKEN) refreshToken: string, @Res() res: Response, @Useragent() agent: string) {
        if (!refreshToken) {
            throw new UnauthorizedException();
        }
        const tokens = await this.authService.refreshTokens(refreshToken, agent);
        if (!tokens) {
            throw new UnauthorizedException();
        }
        this.setRefreshTokenToCookies(tokens, res);
    }

    private setRefreshTokenToCookies(tokens: Tokens, res: Response) {
        if (!tokens) {
            throw new UnauthorizedException();
        }

        res.cookie(REFRESH_TOKEN, tokens.refreshToken.token, {
            httpOnly: true,
            sameSite: 'lax',
            expires: new Date(tokens.refreshToken.exp),
            secure: this.confugService.get('NODE_ENV', 'development') === 'production',
            path: '/',
        });
        res.status(HttpStatus.CREATED).json({ accessToken: tokens.accessToken });
    }

    @UseGuards(GoogleGuard)
    @Get('google')
    googleAuth() {}

    @UseGuards(GoogleGuard)
    @Get('google/callback')
    googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        const token = req.user['accessToken'];
        return res.redirect(`http://localhost:3000/api/auth/success-google?token=${token}`);
    }

    @Get('success-google')
    successGoogle(@Query('token') token: string, @Useragent() agent: string, @Res() res: Response) {
        return this.httpService.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`).pipe(
            mergeMap(({ data: { email } }) => this.authService.providerAuth(email, agent, Provider.GOOGLE)),
            map((data) => this.setRefreshTokenToCookies(data, res)),
            handleTimeoutAndErrors(),
        );
    }

    @UseGuards(YandexGuard)
    @Get('yandex')
    yandexAuth() {}

    @UseGuards(YandexGuard)
    @Get('yandex/callback')
    yandexAuthCallback(@Req() req: Request, @Res() res: Response) {
        const token = req.user['accessToken'];
        return res.redirect(`http://localhost:3000/api/auth/success-yandex?token=${token}`);
    }

    @Get('success-yandex')
    successYandex(@Query('token') token: string, @Useragent() agent: string, @Res() res: Response) {
        return this.httpService.get(`https://login.yandex.ru/info?format=json&oauth_token=${token}`).pipe(
            mergeMap(({ data: { default_email } }) =>
                this.authService.providerAuth(default_email, agent, Provider.YANDEX),
            ),
            map((data) => this.setRefreshTokenToCookies(data, res)),
            handleTimeoutAndErrors(),
        );
    }
}
