import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', default: 'misc' },
        processImage: { type: 'boolean', default: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'misc',
    @Query('processImage') processImage = 'true',
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.uploadsService.uploadSingle(
      file,
      folder,
      processImage === 'true',
    );
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files (max 10)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        folder: { type: 'string', default: 'misc' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder = 'misc',
    @Query('processImage') processImage = 'true',
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return this.uploadsService.uploadMultiple(
      files,
      folder,
      processImage === 'true',
    );
  }

  @Post('image-with-thumbnail')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image with auto-generated thumbnail' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', default: 'images' },
      },
    },
  })
  async uploadWithThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'images',
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }
    return this.uploadsService.uploadWithThumbnails(file, folder);
  }

  @Post('responsive')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image with responsive sizes (sm, md, lg, xl)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', default: 'images' },
      },
    },
  })
  async uploadResponsive(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'images',
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }
    return this.uploadsService.uploadResponsive(file, folder);
  }

  @Delete(':path(*)')
  @ApiOperation({ summary: 'Delete a file by path' })
  async delete(@Param('path') path: string) {
    await this.uploadsService.delete(path);
    return { success: true, message: 'File deleted' };
  }

  @Get('url')
  @ApiOperation({ summary: 'Get public URL for a stored file' })
  getUrl(@Query('path') path: string) {
    return { url: this.uploadsService.getUrl(path) };
  }
}
