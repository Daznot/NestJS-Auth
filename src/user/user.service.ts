import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
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

    delete(id: string) {
        return this.prismaService.user.delete({ where: { id } });
    }

    private hashPassword(password: string) {
        return hashSync(password, genSaltSync(10));
    }
}
