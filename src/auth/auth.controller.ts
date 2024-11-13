import { Body, Controller, Get, Post } from '@nestjs/common';
import { LoginDTO, RegisterDTO } from './dto';

@Controller('auth')
export class AuthController {
    @Post('register')
    register(@Body() dto: RegisterDTO) {}

    @Post('login')
    login(@Body() dto: LoginDTO) {}

    @Get('refresh')
    refreshTokens() {}
}
