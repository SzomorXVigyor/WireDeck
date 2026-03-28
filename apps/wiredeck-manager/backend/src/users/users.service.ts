import { Injectable, Logger } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { USERS } from '../utils/env';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private users: UserEntity[];

  constructor() {
    this.users = USERS as UserEntity[];
    this.logger.log(`Loaded ${this.users.length} user(s) from configuration`);
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
