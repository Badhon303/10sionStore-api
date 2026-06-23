import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Public')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Store Templates (Public listing) ───
  @Get('templates')
  async templates() {
    return this.prisma.storeTemplate.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        features: true,
        price: true,
        setupFee: true,
        monthlyFee: true,
        thumbnail: true,
        screenshots: true,
        sortOrder: true,
        _count: { select: { stores: true } },
      },
    });
  }

  @Get('templates/:slug')
  async templateDetail(@Param('slug') slug: string) {
    const template = await this.prisma.storeTemplate.findUnique({
      where: { slug, isActive: true },
      include: {
        _count: { select: { stores: true, requests: true } },
      },
    });
    if (!template) return { error: 'Template not found' };
    return template;
  }

  // ─── Store Request (Public submission) ───
  @Post('store-request')
  async submitRequest(@Body() body: any) {
    const template = await this.prisma.storeTemplate.findUnique({
      where: { id: body.templateId, isActive: true },
    });
    if (!template) return { error: 'Template not found' };

    return this.prisma.storeRequest.create({
      data: {
        templateId: body.templateId,
        clientName: body.clientName,
        clientEmail: body.clientEmail,
        clientPhone: body.clientPhone,
        businessName: body.businessName,
        businessType: body.businessType || null,
        notes: body.notes || null,
        status: 'PENDING',
      },
      include: {
        template: { select: { id: true, name: true, slug: true } },
      },
    });
  }
}
