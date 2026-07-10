import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IStorageProvider } from "../storage.interface.js";
import { Readable } from "node:stream";
import { BadRequest } from "../../../Common/Exeptions/domain.error.js";

export class SupabaseStorageProvider implements IStorageProvider {
  private client: SupabaseClient;
  private bucketName: string;

  constructor(url: string, key: string, bucket: string) {
    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
    this.bucketName = bucket;
  }

  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ publicUrl: string; storageKey: string }> {
    if (!file?.buffer) {
      throw new BadRequest("No file buffer found");
    }

    const cleanFolder = folder.replace(/\/+$/, "");
    const filename = `${Date.now()}-${file.originalname}`;
    const storageKey = cleanFolder ? `${cleanFolder}/${filename}` : filename;

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .upload(storageKey, file.buffer, {
        contentType: file.mimetype,
        duplex: "half",
      });

    if (error) {
      throw new BadRequest(`Supabase upload failed: ${error.message}`);
    }

    const publicUrl = this.getPublicUrl(storageKey);

    return {
      publicUrl,
      storageKey,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucketName)
      .remove([storageKey]);

    if (error) {
      throw new BadRequest(`Supabase delete failed: ${error.message}`);
    }
  }

  getPublicUrl(storageKey: string): string {
    const { data } = this.client.storage
      .from(this.bucketName)
      .getPublicUrl(storageKey);

    return data.publicUrl;
  }

  async download(storageKey: string): Promise<Readable> {
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .download(storageKey);

    if (error) {
      throw new BadRequest(`Supabase download failed: ${error.message}`);
    }

    if (!data) {
      throw new BadRequest("No file data received from Supabase");
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return Readable.from(buffer);
  }

  async exists(storageKey: string): Promise<boolean> {
    const pathParts = storageKey.split("/");
    const filename = pathParts.pop();
    const folder = pathParts.join("/");

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .list(folder || undefined, {
        search: filename,
      });

    if (error || !data) {
      return false;
    }

    return data.some((item) => item.name === filename);
  }
}
