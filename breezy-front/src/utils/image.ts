export const ALLOWED_IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp"] as const;
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp";

export function validateImageFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    !(ALLOWED_IMAGE_EXT as readonly string[]).includes(ext) ||
    !ALLOWED_IMAGE_MIME.includes(file.type)
  ) {
    return "Format non autorisé (jpg, jpeg, png, gif, webp).";
  }
  if (file.size > MAX_IMAGE_SIZE) return "Image trop volumineuse (5 Mo max).";
  return null;
}
