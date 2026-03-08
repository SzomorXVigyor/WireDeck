import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  private users: UserEntity[];

  constructor(private configService: ConfigService) {
    this.users = this.configService.get<UserEntity[]>('USERS') || [];
    console.log(`Loaded ${this.users.length} users from configuration`);
  }

  async findOne(username: string): Promise<UserEntity | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async validateUser(username: string, password: string): Promise<boolean> {
    const user = await this.findOne(username);
    if (!user) {
      return false;
    }
    return user.password === password;
  }

  async getAllUsers(): Promise<Omit<UserEntity, 'password'>[]> {
    return this.users.map(({ password: _, ...rest }) => rest);
  }
}
