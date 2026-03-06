import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface User {
  username: string;
  password: string;
  changeToken?: string;
}

@Injectable()
export class UsersService {
  private users: User[];

  constructor(private configService: ConfigService) {
    this.users = this.configService.get<User[]>('USERS') || [];
    console.log(`Loaded ${this.users.length} users from configuration`);
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async validateUser(username: string, password: string): Promise<boolean> {
    const user = await this.findOne(username);
    if (!user) {
      return false;
    }
    return user.password === password;
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    return this.users.map((user) => ({
      username: user.username,
      changeToken: user.changeToken,
    }));
  }
}
