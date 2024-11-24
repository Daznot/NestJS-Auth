import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpStatus,
    Post,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO, RegisterDTO } from './dto';
import { AuthService } from './auth.service';
import { Tokens } from './interfaces';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Cookie } from '@common/decorators';

const REFRESH_TOKEN = 'refreshtoken';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly confugService: ConfigService,
    ) {}

    @Post('register')
    async register(@Body() dto: RegisterDTO) {
        const user = await this.authService.register(dto);
        if (!user) {
            throw new BadRequestException(
                `Неполучается зарегистрировать пользователя с данными: ${JSON.stringify(dto)}`,
            );
        }
    }

    @Post('login')
    async login(@Body() dto: LoginDTO, @Res() res: Response) {
        const tokens = await this.authService.login(dto);
        if (!tokens) {
            throw new BadRequestException(`Не получается войти с данными: ${JSON.stringify(dto)}`);
        }
        this.setRefreshTokenToCookies(tokens, res);
    }

    @Get('refresh-tokens')
    refreshTokens(@Cookie(REFRESH_TOKEN) refreshToken: string, @Res() res: Response) {
        if (refreshToken) {
            throw new UnauthorizedException()
        }

		const tokens = await this.authService.refreshTokens(refreshToken);
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
}
