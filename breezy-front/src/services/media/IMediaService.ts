export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface IMediaService {
  uploadVideo(file: File, onProgress?: (percent: number) => void): Promise<UploadResult>;
  deleteVideo(filename: string): Promise<void>;
}
