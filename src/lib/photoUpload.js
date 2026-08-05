/**
 * photoUpload.js — browser-side half of the photo library upload.
 *
 * The browser does the image work so Railway never sees the bytes:
 *   1. Read the EXIF capture date out of the JPEG header.
 *   2. Downscale to a 2048px web copy and a 500px thumbnail on a canvas.
 *   3. Ask the API for presigned R2 URLs.
 *   4. PUT the original and both derivatives straight to Cloudflare.
 *   5. Tell the API the upload finished.
 *
 * Doing the resize here rather than server-side matters more than it looks: a
 * 40 MB original would otherwise be uploaded to Railway, buffered in memory,
 * resized, and re-uploaded to R2 — three transfers and a memory spike per photo.
 *
 * These constants must match WEB_MAX_EDGE / THUMB_MAX_EDGE in
 * rodeo-fresh/routes/photos.js, which regenerates derivatives when this path
 * fails (HEIC on a browser that can't decode it, for instance).
 */

const API_BASE =
  import.meta.env.VITE_RAILWAY_API_URL || 'https://api.holmdalerodeo.ca/api';

export const WEB_MAX_EDGE = 2048;
export const THUMB_MAX_EDGE = 500;

const WEB_QUALITY = 0.85;
const THUMB_QUALITY = 0.75;

export const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/heic', 'image/heif', 'image/avif', 'image/tiff'
];

// ─────────────────────────────────────────────────────────────
//  EXIF capture date
// ─────────────────────────────────────────────────────────────

/**
 * Pull DateTimeOriginal out of a JPEG's EXIF block.
 *
 * Worth the ~60 lines of DataView work: without it every photo sorts by upload
 * time, so a shoebox of 2019 shots uploaded today would all file under 2026 and
 * the archive loses its chronology. Only the first 128 KB is read — EXIF lives
 * near the start of the file, and reading a 40 MB buffer to find a timestamp
 * would stall the page.
 *
 * Returns an ISO string, or null for non-JPEGs and photos with no EXIF date.
 */
export async function readCaptureDate(file) {
  try {
    if (!/jpe?g/i.test(file.type)) return null;

    const head = await file.slice(0, 131072).arrayBuffer();
    const view = new DataView(head);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // not a JPEG

    let offset = 2;
    while (offset < view.byteLength - 4) {
      if (view.getUint8(offset) !== 0xff) return null; // marker stream broke
      const marker = view.getUint8(offset + 1);
      const size = view.getUint16(offset + 2);

      if (marker === 0xe1) {
        // APP1: "Exif\0\0" then a TIFF header
        const exifStart = offset + 4;
        if (view.getUint32(exifStart) !== 0x45786966) return null; // not "Exif"

        const tiff = exifStart + 6;
        const little = view.getUint16(tiff) === 0x4949;
        const ifd0 = tiff + view.getUint32(tiff + 4, little);

        const date =
          findDateTag(view, tiff, ifd0, little) ||
          null;
        return date;
      }

      if (marker === 0xda) return null; // start of scan — past the metadata
      offset += 2 + size;
    }
    return null;
  } catch {
    // A malformed header is not worth failing an upload over.
    return null;
  }
}

/** Walk IFD0, follow the Exif sub-IFD, and return the first date tag found. */
function findDateTag(view, tiffStart, dirStart, little) {
  const DATE_TIME_ORIGINAL = 0x9003;
  const DATE_TIME_DIGITIZED = 0x9004;
  const DATE_TIME = 0x0132;
  const EXIF_IFD_POINTER = 0x8769;

  const readDir = (start, depth) => {
    if (depth > 2 || start + 2 > view.byteLength) return null;
    const count = view.getUint16(start, little);
    let subIfd = null;

    for (let i = 0; i < count; i++) {
      const entry = start + 2 + i * 12;
      if (entry + 12 > view.byteLength) break;
      const tag = view.getUint16(entry, little);

      if (tag === EXIF_IFD_POINTER) {
        subIfd = tiffStart + view.getUint32(entry + 8, little);
      } else if (tag === DATE_TIME_ORIGINAL || tag === DATE_TIME_DIGITIZED || tag === DATE_TIME) {
        const valueOffset = tiffStart + view.getUint32(entry + 8, little);
        const iso = parseExifDate(view, valueOffset);
        if (iso) return iso;
      }
    }
    // DateTimeOriginal lives in the Exif sub-IFD on most cameras, so only fall
    // back to walking it once IFD0 turns up nothing.
    return subIfd ? readDir(subIfd, depth + 1) : null;
  };

  return readDir(dirStart, 0);
}

/** EXIF stores dates as the fixed 19-char string "YYYY:MM:DD HH:MM:SS". */
function parseExifDate(view, offset) {
  if (offset + 19 > view.byteLength) return null;
  let s = '';
  for (let i = 0; i < 19; i++) s += String.fromCharCode(view.getUint8(offset + i));

  const m = s.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;

  const [, y, mo, d, h, mi, sec] = m;
  // EXIF timestamps carry no timezone; treat them as local time, which is what
  // the camera clock was set to.
  const date = new Date(+y, +mo - 1, +d, +h, +mi, +sec);
  if (isNaN(date.getTime())) return null;
  // Guard against a camera with a dead battery reporting 1980.
  if (date.getFullYear() < 1990 || date.getFullYear() > new Date().getFullYear() + 1) return null;
  return date.toISOString();
}

// ─────────────────────────────────────────────────────────────
//  Derivative generation
// ─────────────────────────────────────────────────────────────

/**
 * Decode a file into an ImageBitmap.
 *
 * createImageBitmap decodes off the main thread and honours EXIF orientation,
 * so a portrait phone photo doesn't come out sideways. It throws on formats the
 * browser can't decode (HEIC outside Safari) — callers treat that as "let the
 * server handle it" rather than an upload failure.
 */
async function decode(file) {
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

function scaledSize(width, height, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

async function toJpegBlob(bitmap, maxEdge, quality) {
  const { width, height } = scaledSize(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Flatten onto white: PNGs with transparency would otherwise turn black in JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', quality));
  // Free the backing store immediately; a queue of these adds up fast on mobile.
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error('Could not encode image');
  return blob;
}

/**
 * Build both derivatives plus the true pixel dimensions.
 * Returns null when the browser can't decode the format at all.
 */
export async function buildDerivatives(file) {
  let bitmap;
  try {
    bitmap = await decode(file);
  } catch {
    return null;
  }
  try {
    const web = await toJpegBlob(bitmap, WEB_MAX_EDGE, WEB_QUALITY);
    const thumb = await toJpegBlob(bitmap, THUMB_MAX_EDGE, THUMB_QUALITY);
    return { web, thumb, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close?.();
  }
}

// ─────────────────────────────────────────────────────────────
//  Upload
// ─────────────────────────────────────────────────────────────

/**
 * PUT a blob to a presigned R2 URL.
 *
 * XMLHttpRequest rather than fetch purely for upload progress — fetch still has
 * no request-body progress event, and a 40 MB upload with no progress bar looks
 * broken on a phone at the rodeo grounds.
 */
function putToR2(url, blob, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    // The signature covers Content-Type, so this must match what the server signed.
    xhr.setRequestHeader('Content-Type', contentType);

    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
    }
    xhr.onload = () =>
      (xhr.status >= 200 && xhr.status < 300)
        ? resolve()
        : reject(new Error(`Storage rejected the upload (${xhr.status})`));
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.timeout = 10 * 60 * 1000;
    xhr.send(blob);
  });
}

async function postJson(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/**
 * Upload one photo end to end.
 *
 * `fields` carries the uploader details and consent for public submissions, or
 * album/caption for staff ones. `token` set means the staff endpoints are used
 * and the photo is auto-approved.
 *
 * Progress is weighted: the original is the overwhelming majority of the bytes,
 * so the derivatives barely move the bar.
 */
export async function uploadPhoto(file, fields = {}, { token = null, onProgress } = {}) {
  const report = p => onProgress?.(Math.max(0, Math.min(1, p)));

  report(0.01);
  const [captureDate, derivatives] = await Promise.all([
    readCaptureDate(file),
    buildDerivatives(file)
  ]);
  report(0.05);

  const prefix = token ? '' : '/public';
  const init = await postJson(
    `/photos${prefix}/upload-init`,
    {
      ...fields,
      filename: file.name,
      content_type: file.type,
      size: file.size,
      taken_at: captureDate || new Date(file.lastModified).toISOString(),
      width: derivatives?.width ?? null,
      height: derivatives?.height ?? null,
      // Tells the server not to presign derivative slots it will never receive;
      // it regenerates them with sharp instead.
      derivatives: Boolean(derivatives)
    },
    token
  );

  await putToR2(
    init.uploads.original.url,
    file,
    init.uploads.original.content_type,
    p => report(0.05 + p * 0.85)
  );

  if (derivatives && init.uploads.web && init.uploads.thumb) {
    await putToR2(init.uploads.web.url, derivatives.web, 'image/jpeg');
    report(0.95);
    await putToR2(init.uploads.thumb.url, derivatives.thumb, 'image/jpeg');
  }
  report(0.98);

  await postJson(
    token ? `/photos/${init.id}/complete` : `/photos/public/${init.id}/complete`,
    { upload_token: init.upload_token },
    token
  );
  report(1);

  return { id: init.id, processedServerSide: !derivatives };
}

// ─────────────────────────────────────────────────────────────
//  Read-only gallery helpers
// ─────────────────────────────────────────────────────────────

export async function fetchPublicPhotos(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const res = await fetch(`${API_BASE}/photos/public?${qs}`);
  if (!res.ok) throw new Error('Could not load photos');
  return res.json();
}

export async function fetchPublicAlbums() {
  const res = await fetch(`${API_BASE}/photos/public/albums`);
  if (!res.ok) throw new Error('Could not load albums');
  return res.json();
}

export async function fetchUploadInfo() {
  const res = await fetch(`${API_BASE}/photos/public/upload-info`);
  if (!res.ok) throw new Error('Could not load upload settings');
  return res.json();
}
