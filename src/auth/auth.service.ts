import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDTO, RegisterDTO } from './dto';
import { UserService } from '@user/user.service';
import { Tokens } from './interfaces';
import { compareSync } from 'bcrypt';
import { Token, User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@prisma/prisma.service';
import { v4 } from 'uuid';
import { add } from 'date-fns';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
    ) {}

    async refreshTokens(refreshToken: string): Promise<Tokens> {
        const token = await this.prismaService.token.delete({ where: { token: refreshToken } });
        if (!token) {
            throw new UnauthorizedException();
        }
        const user = await this.userService.findOne(token.userId);
        return this.generateTokens(user);
    }

    async register(dto: RegisterDTO) {
        const user: User = await this.userService.findOne(dto.email).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (user) {
            throw new ConflictException('Пользователь с таким email уже зарегистрирован');
        }

        return this.userService.save(dto).catch((err) => {
            this.logger.error(err);
            return null;
        });
    }

    async login(dto: LoginDTO): Promise<Tokens> {
        const user: User = await this.userService.findOne(dto.email).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (!user || compareSync(dto.password, user.password)) {
            throw new UnauthorizedException('Неверный логин или пароль');
        }

        return this.generateTokens(user);
    }

    private async generateTokens(user: User): Promise<Tokens> {
        const accessToken =
            'Bearer ' +
            this.jwtService.sign({
                id: user.id,
                email: user.email,
                roles: user.Role,
            });

        const refreshToken = await this.getRefreshToken(user.id);
        return { accessToken, refreshToken };
    }

    private async getRefreshToken(userId: string): Promise<Token> {
        return this.prismaService.token.create({
            data: {
                token: v4(),
                exp: add(new Date(), { months: 1 }),
                userId,
            },
        });
    }
}
