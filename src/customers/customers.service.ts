import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginated } from '../common/dto/pagination.dto';
import { CreateCustomerDto, CustomerQueryDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Find or create a customer by phone within a store (used during checkout). */
  async upsert(storeId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.upsert({
      where: { storeId_phone: { storeId, phone: dto.phone } },
      update: {
        name: dto.name,
        email: dto.email,
        address: dto.address,
        district: dto.district,
        thana: dto.thana,
      },
      create: { storeId, ...dto },
    });
  }

  async create(storeId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: { storeId, ...dto } });
  }

  async findAll(storeId: string, q: CustomerQueryDto) {
    const where: Prisma.CustomerWhereInput = {
      storeId,
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { phone: { contains: q.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: q.skip,
        take: q.limit,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return paginated(items, total, q.page, q.limit);
  }

  async findOne(storeId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, storeId },
      include: { orders: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(storeId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(storeId, id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async setBlocked(storeId: string, id: string, isBlocked: boolean) {
    await this.findOne(storeId, id);
    return this.prisma.customer.update({ where: { id }, data: { isBlocked } });
  }
}
