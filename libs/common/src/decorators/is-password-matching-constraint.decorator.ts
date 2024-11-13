import { RegisterDTO } from '@auth/dto';
import { ValidatorConstraint, ValidationArguments, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsPasswordMatching', async: false })
export class IsPasswordsMatchingConstraint implements ValidatorConstraintInterface {
    validate(passwordRepeat: string, args: ValidationArguments) {
        const obj = args.object as RegisterDTO;
        return obj.password === passwordRepeat;
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'Пароли не совпадают';
    }
}
