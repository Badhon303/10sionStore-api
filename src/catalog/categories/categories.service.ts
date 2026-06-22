import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify, randomSuffix } from '../../common/utils/slug.util';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async uniqueSlug(storeId: string, base: string) {
    let slug = slugify(base) || 'category';
    let candidate = slug;
    while (await this.prisma.category.findFirst({ where: { storeId, slug: candidate } })) {
      candidate = `${slug}-${randomSuffix(4)}`;
    }
    return candidate;
  }

  async create(storeId: string, dto: CreateCategoryDto) {
    const slug = await this.uniqueSlug(storeId, dto.slug || dto.name);
    return this.prisma.category.create({
      data: {
        storeId,
        name: dto.name,
        slug,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  findAll(storeId: string) {
    return this.prisma.category.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
      include: { children: true, _count: { select: { products: true } } },
    });
  }

  async findOne(storeId: string, id: string) {
    const cat = await this.prisma.category.findFirst({ where: { id, storeId } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(storeId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(storeId, id);
    const data: any = { ...dto };
    if (dto.slug) data.slug = await this.uniqueSlug(storeId, dto.slug);
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(storeId: string, id: string) {
    await this.findOne(storeId, id);
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
