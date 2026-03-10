import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type { IStorageService } from '../../uploads/storage.service.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(private config: ConfigService) {}

  async upload(file: Express.Multer.File): Promise<string> {
    await fs.mkdir(this.uploadsDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(this.uploadsDir, filename);

    await fs.writeFile(filepath, file.buffer);

    const baseUrl = this.config.get<string>('BASE_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${filename}`;
  }

  async delete(fileUrl: string): Promise<void> {
    const filename = path.basename(fileUrl);
    const filepath = path.join(this.uploadsDir, filename);

    await fs.unlink(filepath).catch(() => {});
  }
}
