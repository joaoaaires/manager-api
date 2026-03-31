import { UserRegistrationDto } from '@common/dto/user-registration.dto';

/** Corpo de registro público; validação compartilhada com `CreateUserDto` via `UserRegistrationDto`. */
export class SignUpDto extends UserRegistrationDto {}
