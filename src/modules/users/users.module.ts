import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Membership } from './entities/membership.entity';
import { UserRole } from '../auth/entities/user-role.entity';
import { Role } from '../auth/entities/role.entity';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Membership, UserRole, Role]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService],
})
export class UsersModule {}
