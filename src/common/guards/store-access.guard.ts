import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Verifies the :storeId route param belongs to the authenticated merchant,
 * or to an employee that is scoped to that store.
 */
@Injectable()
export class StoreAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const storeId = request.params?.storeId;

    if (!storeId) {
      return true;
    }
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, merchantId: true, isActive: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Employee: must belong to this store
    if (user.type === 'employee') {
      if (user.storeId !== storeId) {
        throw new ForbiddenException('No access to this store');
      }
      request.store = store;
      return true;
    }

    // Merchant: must own the store
    if (store.merchantId !== user.sub) {
      throw new ForbiddenException('No access to this store');
    }

    request.store = store;
    return true;
  }
}
