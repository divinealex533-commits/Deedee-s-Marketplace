/** Browser-only: shrinks a photo/screenshot to a sharp JPEG before upload. */
export async function compressImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
    const supported = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!blob) return file;
    return blob.size < file.size || !supported ? blob : file;
  } catch {
    return file;
  }
}
