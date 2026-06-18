import { api } from "../api";
import { IUploadService } from "./IUploadService";

export class HttpUploadService implements IUploadService {
  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("image", file);
    const { data } = await api.post<{ url: string }>("/uploads", form, {
      headers: { "Content-Type": undefined },
    });
    return data.url;
  }
}
