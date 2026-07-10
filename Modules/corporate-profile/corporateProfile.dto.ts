export interface CorporateProfileDto {
  fileUrl: string;
  publicId: string;
  resourceType: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface CorporateProfileResponseDto {
  previewUrl: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  updatedAt: Date;
}
