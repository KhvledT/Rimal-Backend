import type { Readable } from "node:stream";

export interface IStorageProvider {
  upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{
    publicUrl: string;
    storageKey: string;
  }>;
  delete(storageKey: string): Promise<void>;
  getPublicUrl(storageKey: string): string;
  download(storageKey: string): Promise<Readable>;
  exists(storageKey: string): Promise<boolean>;
}
