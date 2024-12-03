import { JwtPayload } from '@auth/interfaces';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) {}

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

    findOne(idOrMail: string) {
        return this.prismaService.user.findFirst({
            where: {
                OR: [{ id: idOrMail }, { email: idOrMail }],
            },
        });
    }

    delete(id: string, user: JwtPayload) {
        console.log(id);
        console.log(user);

        if (user.id !== id || !user.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException('ты шо ебанулся');
        }
        return this.prismaService.user.delete({ where: { id }, select: { id: true } });
    }

    private hashPassword(password: string) {
        return hashSync(password, genSaltSync(10));
    }
}
