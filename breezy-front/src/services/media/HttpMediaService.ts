import { api } from "../api";
import { IMediaService, UploadResult } from "./IMediaService";

export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 Mo

export class HttpMediaService implements IMediaService {
  async uploadVideo(file: File, onProgress?: (percent: number) => void): Promise<UploadResult> {
    if (!file.type.startsWith("video/")) {
      throw new Error("Seules les vidéos sont autorisées.");
    }
    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error("La vidéo dépasse la limite de 100 Mo.");
    }

    const form = new FormData();
    form.append("video", file);

    const { data } = await api.post<UploadResult>("/media/upload", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });

    return data;
  }

  async deleteVideo(filename: string): Promise<void> {
    await api.delete(`/media/videos/${filename}`);
  }
}
