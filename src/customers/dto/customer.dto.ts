import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thana?: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class CustomerQueryDto extends PaginationDto {}
