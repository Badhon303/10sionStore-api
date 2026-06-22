import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import * as path from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MerchantsModule } from './merchants/merchants.module';
import { StoresModule } from './stores/stores.module';
import { EmployeesModule } from './employees/employees.module';
import { CatalogModule } from './catalog/catalog.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { FraudModule } from './fraud/fraud.module';
import { OffersModule } from './offers/offers.module';
import { PaymentsModule } from './payments/payments.module';
import { CourierModule } from './courier/courier.module';
import { MarketingModule } from './marketing/marketing.module';
import { TrackingModule } from './tracking/tracking.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadsModule } from './uploads/uploads.module';
import { IncompleteOrdersModule } from './incomplete-orders/incomplete-orders.module';
import { LandingPagesModule } from './landing-pages/landing-pages.module';
import { TargetsModule } from './targets/targets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QueueModule } from './queue/queue.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: path.resolve(
            config.get<string>('LOCAL_UPLOAD_PATH') || './uploads',
          ),
          serveRoot: '/static',
          servePrefix: '',
        },
      ],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60000,
          limit: config.get<number>('THROTTLE_LIMIT') || 100,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    MerchantsModule,
    StoresModule,
    EmployeesModule,
    CatalogModule,
    CustomersModule,
    OrdersModule,
    FraudModule,
    OffersModule,
    PaymentsModule,
    CourierModule,
    MarketingModule,
    TrackingModule,
    AnalyticsModule,
    UploadsModule,
    IncompleteOrdersModule,
    LandingPagesModule,
    TargetsModule,
    NotificationsModule,
    QueueModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
