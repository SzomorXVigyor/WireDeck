import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { UsernameListDto } from './dto/usernames-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private users: UserEntity[];

  constructor(private configService: ConfigService) {
    this.users = this.configService.get<UserEntity[]>('USERS') || [];
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

  async getAllUsernames(): Promise<UsernameListDto> {
    const usernames = this.users.map((user) => user.username);
    return { usernames };
  }
}
