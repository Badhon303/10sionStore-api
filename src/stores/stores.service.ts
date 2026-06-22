import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify, randomSuffix } from '../common/utils/slug.util';
import { CreateStoreDto, SetDomainDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  private async uniqueSlug(base: string): Promise<string> {
    let slug = slugify(base);
    if (!slug) slug = 'store';
    let candidate = slug;
    while (await this.prisma.store.findUnique({ where: { slug: candidate } })) {
      candidate = `${slug}-${randomSuffix(4)}`;
    }
    return candidate;
  }

  async create(merchantId: string, dto: CreateStoreDto) {
    const slug = await this.uniqueSlug(dto.slug || dto.name);
    return this.prisma.store.create({
      data: {
        merchantId,
        name: dto.name,
        slug,
        description: dto.description,
        currency: dto.currency || 'BDT',
        plan: dto.plan,
        settings: dto.settings,
      },
    });
  }

  async findAll(merchantId: string) {
    return this.prisma.store.findMany({
      where: { merchantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(merchantId: string, storeId: string) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantId },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async update(merchantId: string, storeId: string, dto: UpdateStoreDto) {
    await this.findOne(merchantId, storeId);
    const data: any = { ...dto };
    if (dto.slug) {
      data.slug = await this.uniqueSlug(dto.slug);
    }
    return this.prisma.store.update({ where: { id: storeId }, data });
  }

  async softDelete(merchantId: string, storeId: string) {
    await this.findOne(merchantId, storeId);
    await this.prisma.store.update({ where: { id: storeId }, data: { isActive: false } });
    return { message: 'Store deactivated' };
  }

  async setDomain(merchantId: string, storeId: string, dto: SetDomainDto) {
    await this.findOne(merchantId, storeId);
    const existing = await this.prisma.store.findUnique({ where: { domain: dto.domain } });
    if (existing && existing.id !== storeId) {
      throw new ConflictException('Domain already in use');
    }
    return this.prisma.store.update({
      where: { id: storeId },
      data: { domain: dto.domain },
    });
  }
}
