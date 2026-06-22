import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('stores/:storeId/employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Post()
  create(@Param('storeId') storeId: string, @Body() dto: CreateEmployeeDto) {
    return this.service.create(storeId, dto);
  }

  @Get()
  findAll(@Param('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  @Get(':id')
  findOne(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.findOne(storeId, id);
  }

  @Patch(':id')
  update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.update(storeId, id, dto);
  }

  @Delete(':id')
  remove(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.service.remove(storeId, id);
  }
}
