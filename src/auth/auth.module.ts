import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { options } from './config';
import { UserModule } from '@user/user.module';

@Module({
    controllers: [AuthController],
    providers: [AuthService],
    imports: [PassportModule, JwtModule.registerAsync(options()), UserModule],
})
export class AuthModule {}
