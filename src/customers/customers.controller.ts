import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { CreateCustomerDto, CustomerQueryDto, UpdateCustomerDto } from './dto/customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  create(@Param('storeId') storeId: string, @Body() dto: CreateCustomerDto) {
    return this.service.create(storeId, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string, @Query() q: CustomerQueryDto) {
    return this.service.findAll(storeId, q);
  }

  @Get(':id')
  findOne(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.findOne(storeId, id);
  }

  @Patch(':id')
  update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.service.update(storeId, id, dto);
  }

  @Patch(':id/block')
  block(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.setBlocked(storeId, id, true);
  }

  @Patch(':id/unblock')
  unblock(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.setBlocked(storeId, id, false);
  }
}
