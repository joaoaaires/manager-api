// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as bcrypt from 'bcrypt';
// import { randomBytes } from 'crypto';

// import { Prisma } from '../../generated/prisma/client';
// import { PrismaService } from '../prisma/prisma.service';
// import { TenantProvisioningService } from '../tenant/tenant-provisioning.service';
// import { CreateUserDto } from './dto';
// import { EmailAlreadyExistsException, UserNotFoundException } from './errors';

// @Injectable()
// export class UserService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly configService: ConfigService,
//     private readonly provisioningService: TenantProvisioningService,
//   ) {}

//   private generateTenantName(): string {
//     const suffix = randomBytes(4).toString('hex');
//     return `tenant_${suffix}`;
//   }

//   async create(createUserDto: CreateUserDto) {
//     const user = await this.prisma.user.findUnique({
//       where: {
//         email: createUserDto.email,
//       },
//     });

//     if (user) {
//       throw new EmailAlreadyExistsException();
//     }

//     const salt = this.configService.getOrThrow<number>('salt');
//     const passwordCrypt = await bcrypt.hash(createUserDto.password, salt);

//     const tenantName = this.generateTenantName();

//     await this.prisma.$executeRawUnsafe(`CREATE SCHEMA "${tenantName}"`);

//     try {
//       await this.provisioningService.provisionTenant(tenantName);

//       const data: Prisma.UserCreateInput = {
//         name: createUserDto.name,
//         email: createUserDto.email,
//         password: passwordCrypt,
//         tenant_name: tenantName,
//       };

//       return await this.prisma.user.create({
//         data,
//       });
//     } catch (error) {
//       // If any step after schema creation fails, cleanup to avoid orphaned tenants
//       await this.prisma.$executeRawUnsafe(
//         `DROP SCHEMA IF EXISTS "${tenantName}" CASCADE`,
//       );

//       // Unique constraint violated by a concurrent sign-up with the same email
//       if (
//         error instanceof Prisma.PrismaClientKnownRequestError &&
//         error.code === 'P2002'
//       ) {
//         throw new EmailAlreadyExistsException();
//       }

//       throw error;
//     }
//   }

//   async readOneByEmail(email: string) {
//     const user = await this.prisma.user.findFirst({
//       where: {
//         email,
//         deleteAt: null,
//       },
//     });
//     if (!user) {
//       throw new UserNotFoundException();
//     }
//     return user;
//   }

//   async readOneById(id: string) {
//     const user = await this.prisma.user.findFirst({
//       where: {
//         id,
//         deleteAt: null,
//       },
//     });
//     if (!user) {
//       throw new UserNotFoundException();
//     }
//     return user;
//   }
// }
