type UserProps = {
  id?: string;
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};

export class User {
  readonly id?: string;
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly deletedAt?: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt;
  }

  static create(
    props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): User {
    return new User({
      ...props,
    });
  }
}
