import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify, randomSuffix } from '../../common/utils/slug.util';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  private async uniqueSlug(storeId: string, base: string) {
    let slug = slugify(base) || 'brand';
    let candidate = slug;
    while (await this.prisma.brand.findFirst({ where: { storeId, slug: candidate } })) {
      candidate = `${slug}-${randomSuffix(4)}`;
    }
    return candidate;
  }

  async create(storeId: string, dto: CreateBrandDto) {
    const slug = await this.uniqueSlug(storeId, dto.slug || dto.name);
    return this.prisma.brand.create({
      data: { storeId, name: dto.name, slug, logoUrl: dto.logoUrl },
    });
  }

  findAll(storeId: string) {
    return this.prisma.brand.findMany({
      where: { storeId },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(storeId: string, id: string) {
    const brand = await this.prisma.brand.findFirst({ where: { id, storeId } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async update(storeId: string, id: string, dto: UpdateBrandDto) {
    await this.findOne(storeId, id);
    const data: any = { ...dto };
    if (dto.slug) data.slug = await this.uniqueSlug(storeId, dto.slug);
    return this.prisma.brand.update({ where: { id }, data });
  }

  async remove(storeId: string, id: string) {
    await this.findOne(storeId, id);
    await this.prisma.brand.delete({ where: { id } });
    return { message: 'Brand deleted' };
  }
}
