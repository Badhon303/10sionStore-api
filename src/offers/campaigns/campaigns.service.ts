import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  create(storeId: string, dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        storeId,
        name: dto.name,
        type: dto.type,
        config: dto.config,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  findAll(storeId: string) {
    return this.prisma.campaign.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } });
  }

  active(storeId: string) {
    const now = new Date();
    return this.prisma.campaign.findMany({
      where: {
        storeId,
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
    });
  }

  async findOne(storeId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id, storeId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(storeId: string, id: string, dto: UpdateCampaignDto) {
    await this.findOne(storeId, id);
    const data: any = { ...dto };
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) data.endsAt = new Date(dto.endsAt);
    return this.prisma.campaign.update({ where: { id }, data });
  }

  async remove(storeId: string, id: string) {
    await this.findOne(storeId, id);
    await this.prisma.campaign.delete({ where: { id } });
    return { message: 'Campaign deleted' };
  }
}
