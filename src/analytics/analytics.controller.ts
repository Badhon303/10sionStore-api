import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  overview(@Param('storeId') storeId: string) {
    return this.service.overview(storeId);
  }

  @Get('orders-chart')
  ordersChart(
    @Param('storeId') storeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.ordersChart(storeId, from, to);
  }

  @Get('revenue-chart')
  revenueChart(
    @Param('storeId') storeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.revenueChart(storeId, from, to);
  }

  @Get('top-products')
  topProducts(@Param('storeId') storeId: string, @Query('limit') limit?: string) {
    return this.service.topProducts(storeId, limit ? Number(limit) : 10);
  }

  @Get('order-funnel')
  orderFunnel(@Param('storeId') storeId: string) {
    return this.service.orderFunnel(storeId);
  }

  @Get('employee-performance')
  employeePerformance(@Param('storeId') storeId: string) {
    return this.service.employeePerformance(storeId);
  }

  @Get('target-vs-actual')
  targetVsActual(@Param('storeId') storeId: string) {
    return this.service.targetVsActual(storeId);
  }

  @Get('fraud-summary')
  fraudSummary(@Param('storeId') storeId: string) {
    return this.service.fraudSummary(storeId);
  }
}
