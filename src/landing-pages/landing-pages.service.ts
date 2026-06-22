import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify, randomSuffix } from '../common/utils/slug.util';
import { CreateLandingPageDto, UpdateLandingPageDto } from './dto/landing-page.dto';

@Injectable()
export class LandingPagesService {
  constructor(private readonly prisma: PrismaService) {}

  private async uniqueSlug(storeId: string, base: string) {
    let slug = slugify(base) || 'page';
    let candidate = slug;
    while (await this.prisma.landingPage.findFirst({ where: { storeId, slug: candidate } })) {
      candidate = `${slug}-${randomSuffix(4)}`;
    }
    return candidate;
  }

  async create(storeId: string, dto: CreateLandingPageDto) {
    const slug = await this.uniqueSlug(storeId, dto.slug || dto.title);
    return this.prisma.landingPage.create({
      data: {
        storeId,
        title: dto.title,
        slug,
        content: dto.content as Prisma.InputJsonValue,
        templateId: dto.templateId,
        metaTitle: dto.metaTitle,
        metaDesc: dto.metaDesc,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  findAll(storeId: string) {
    return this.prisma.landingPage.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } });
  }

  async findBySlug(storeId: string, slug: string) {
    const page = await this.prisma.landingPage.findFirst({ where: { storeId, slug } });
    if (!page) throw new NotFoundException('Landing page not found');
    return page;
  }

  async update(storeId: string, id: string, dto: UpdateLandingPageDto) {
    const page = await this.prisma.landingPage.findFirst({ where: { id, storeId } });
    if (!page) throw new NotFoundException('Landing page not found');
    const data: any = { ...dto };
    if (dto.slug) data.slug = await this.uniqueSlug(storeId, dto.slug);
    return this.prisma.landingPage.update({ where: { id }, data });
  }

  async setPublished(storeId: string, id: string, isPublished: boolean) {
    const page = await this.prisma.landingPage.findFirst({ where: { id, storeId } });
    if (!page) throw new NotFoundException('Landing page not found');
    return this.prisma.landingPage.update({ where: { id }, data: { isPublished } });
  }

  async remove(storeId: string, id: string) {
    const page = await this.prisma.landingPage.findFirst({ where: { id, storeId } });
    if (!page) throw new NotFoundException('Landing page not found');
    await this.prisma.landingPage.delete({ where: { id } });
    return { message: 'Landing page deleted' };
  }
}
