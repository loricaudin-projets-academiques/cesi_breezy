export interface IUploadService {
  uploadImage(file: File): Promise<string>;
}
