import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateParkingLotDto } from './dto/create-parking-lot.dto.js';
import { QueryParkingLotDto } from './dto/query-parking-lot.dto.js';
import { UpdateParkingLotDto } from './dto/update-parking-lot.dto.js';
import { ParkingLot } from './entities/parking-lot.entity.js';

@Injectable()
export class ParkingLotsService {
  constructor(
    @InjectRepository(ParkingLot)
    private readonly lotsRepository: Repository<ParkingLot>,
  ) {}

  findAll(query: QueryParkingLotDto): Promise<ParkingLot[]> {
    const where = query.search
      ? [
          { name: Like(`%${query.search}%`) },
          { address: Like(`%${query.search}%`) },
        ]
      : undefined;
    return this.lotsRepository.find({ where, order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<ParkingLot> {
    const lot = await this.lotsRepository.findOneBy({ id });
    if (!lot) {
      throw new NotFoundException(`Parking lot #${id} not found`);
    }
    return lot;
  }

  async create(dto: CreateParkingLotDto): Promise<ParkingLot> {
    await this.ensureNameIsFree(dto.name);
    const lot = this.lotsRepository.create(dto);
    return this.lotsRepository.save(lot);
  }

  async update(id: number, dto: UpdateParkingLotDto): Promise<ParkingLot> {
    const lot = await this.findOne(id);
    if (dto.name && dto.name !== lot.name) {
      await this.ensureNameIsFree(dto.name);
    }
    if (Object.keys(dto).length > 0) {
      await this.lotsRepository.update(id, dto);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const lot = await this.findOne(id);
    await this.lotsRepository.remove(lot);
  }

  private async ensureNameIsFree(name: string): Promise<void> {
    if (await this.lotsRepository.existsBy({ name })) {
      throw new ConflictException(
        `A parking lot named "${name}" already exists`,
      );
    }
  }
}
