import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  /** Used by login: the only query that also selects the password hash. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async create(dto: CreateUserDto): Promise<User> {
    const email = dto.email.toLowerCase();
    await this.ensureEmailIsFree(email);

    const user = this.usersRepository.create({
      fullName: dto.fullName,
      email,
      password: await hash(dto.password, SALT_ROUNDS),
      role: dto.role,
      phone: dto.phone ?? null,
    });
    const saved = await this.usersRepository.save(user);
    // Re-read so the response never contains the password hash
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      dto.email = dto.email.toLowerCase();
      await this.ensureEmailIsFree(dto.email);
    }
    if (dto.password) {
      dto.password = await hash(dto.password, SALT_ROUNDS);
    }

    if (Object.keys(dto).length > 0) {
      await this.usersRepository.update(id, dto);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  private async ensureEmailIsFree(email: string): Promise<void> {
    if (await this.usersRepository.existsBy({ email })) {
      throw new ConflictException('Email is already registered');
    }
  }
}
