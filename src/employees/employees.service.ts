import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

const SELECT = {
  id: true,
  storeId: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  permissions: true,
  isActive: true,
  createdAt: true,
};

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, dto: CreateEmployeeDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.employee.create({
      data: {
        storeId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        permissions: dto.permissions,
      },
      select: SELECT,
    });
  }

  findAll(storeId: string) {
    return this.prisma.employee.findMany({ where: { storeId }, select: SELECT });
  }

  async findOne(storeId: string, id: string) {
    const emp = await this.prisma.employee.findFirst({
      where: { id, storeId },
      select: SELECT,
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async update(storeId: string, id: string, dto: UpdateEmployeeDto) {
    await this.findOne(storeId, id);
    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
      delete data.password;
    }
    return this.prisma.employee.update({ where: { id }, data, select: SELECT });
  }

  async remove(storeId: string, id: string) {
    await this.findOne(storeId, id);
    await this.prisma.employee.update({ where: { id }, data: { isActive: false } });
    return { message: 'Employee deactivated' };
  }
}
