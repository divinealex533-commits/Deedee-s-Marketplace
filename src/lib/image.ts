/** Checks a file really is an image by its first bytes, not just its name. */
export function imageType(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

/** Reads an uploaded image from a form. Returns null if none, or an error message. */
export async function readImage(file: FormDataEntryValue | null, maxBytes: number) {
  if (!(file instanceof File) || file.size === 0) return { image: null };
  if (file.size > maxBytes) return { error: `Image is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).` };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = imageType(buf);
  if (!type) return { error: 'Image must be a JPG, PNG or WebP.' };
  return { image: { data: new Uint8Array(buf), type } };
}

/** Customer-facing preview of a login: full, or partly hidden. */
export function previewLogin(login: string, show: boolean) {
  if (show) return login;
  if (login.includes('@')) {
    const [name, domain] = login.split('@');
    return `${name!.slice(0, 2)}•••@${domain!.slice(0, 1)}•••${domain!.slice(domain!.lastIndexOf('.'))}`;
  }
  if (/^\+?\d{7,}$/.test(login)) return `${login.slice(0, 4)}•••${login.slice(-3)}`;
  if (login.length <= 4) return `${login[0]}•••`;
  return `${login.slice(0, 2)}•••${login.slice(-2)}`;
}
