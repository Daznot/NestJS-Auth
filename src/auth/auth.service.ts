import { Injectable } from '@nestjs/common';
import { RegisterDTO } from './dto';
import { UserService } from '@user/user.service';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) {}

    register(dto: RegisterDTO) {
        return this.userService.save(dto).catch((err) => {
            return null;
        });
    }
}
