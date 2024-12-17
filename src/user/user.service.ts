import { JwtPayload } from '@auth/interfaces';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        private readonly prismaService: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async save(user: Partial<User>) {
        const use = await this.prismaService.user.findFirst({ where: { email: user.email } });
        if (use) {
            throw new BadRequestException(`Пользователь с email: ${user.email} - уже существует`);
        }
        const hashedPassword = this.hashPassword(user.password);
        return this.prismaService.user.create({
            data: {
                email: user.email,
                password: hashedPassword,
                Role: ['USER'],
            },
        });
    }

    async findOne(idOrMail: string) {
        const cash = await this.cacheManager.get<User>(idOrMail);
        if (!cash) {
            await this.cacheManager.set(idOrMail);
        }
        const user = await this.prismaService.user.findFirst({
            where: {
                OR: [{ id: idOrMail }, { email: idOrMail }],
            },
        });
        if (!user) {
            throw new BadRequestException('Такого пользователя не существует');
        }
        return user;
    }

    delete(id: string, user: JwtPayload) {
        if (user.id !== id || !user.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException('ты шо ебанулся');
        }
        return this.prismaService.user.delete({ where: { id }, select: { id: true } });
    }

    private hashPassword(password: string) {
        return hashSync(password, genSaltSync(10));
    }
}
