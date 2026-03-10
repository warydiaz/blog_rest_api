export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export interface IStorageService {
  upload(file: Express.Multer.File): Promise<string>;
  delete(fileUrl: string): Promise<void>;
}
