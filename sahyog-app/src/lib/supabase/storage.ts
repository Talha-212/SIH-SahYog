import { getServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server';

// 5 Dedicated Storage Buckets for SahYog Platform
export const BUCKETS = {
  PROBLEM_EVIDENCE: 'problem-evidence',
  VERIFICATION_EVIDENCE: 'verification-evidence',
  AVATARS: 'avatars',
  ORGANIZATION_LOGOS: 'organization-logos',
  DEMO_ASSETS: 'demo-assets',
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'video/mp4',
  'video/quicktime',
  'image/gif'
];

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadFile(mimeType: string, sizeBytes: number): FileValidationResult {
  if (!mimeType) {
    return { valid: false, error: 'File type cannot be determined.' };
  }

  const isAllowed = ALLOWED_MIME_TYPES.some(t => mimeType.toLowerCase().startsWith(t.toLowerCase()));
  if (!isAllowed) {
    return {
      valid: false,
      error: `Unsupported file format (${mimeType}). Please upload a JPEG, PNG, WEBP, or MP4 file.`
    };
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb}MB) exceeds the 15MB maximum upload limit.`
    };
  }

  return { valid: true };
}

export function buildStoragePath(
  bucket: BucketName | string,
  entityId: string = 'unassigned',
  fileName: string = 'evidence.jpg'
): string {
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '.jpg';
  const cleanExt = ext.toLowerCase();
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 8);

  switch (bucket) {
    case BUCKETS.PROBLEM_EVIDENCE:
      return `${entityId}/${timestamp}-${randomId}${cleanExt}`;
    case BUCKETS.VERIFICATION_EVIDENCE:
      return `${entityId}/${timestamp}-${randomId}${cleanExt}`;
    case BUCKETS.AVATARS:
      return `${entityId}/avatar-${timestamp}${cleanExt}`;
    case BUCKETS.ORGANIZATION_LOGOS:
      return `${entityId}/logo-${timestamp}${cleanExt}`;
    case BUCKETS.DEMO_ASSETS:
      return `demo/${timestamp}-${randomId}${cleanExt}`;
    default:
      return `${entityId}/${timestamp}-${randomId}${cleanExt}`;
  }
}

export async function uploadToStorage(params: {
  bucket: BucketName | string;
  path: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = getServerSupabaseClient();
  if (!supabase || !isServerSupabaseConfigured()) {
    return { success: false, error: 'Supabase server client not configured.' };
  }

  try {
    const { error: uploadError } = await supabase.storage
      .from(params.bucket)
      .upload(params.path, params.buffer, {
        contentType: params.contentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(params.bucket)
      .getPublicUrl(params.path);

    return {
      success: true,
      url: publicUrlData.publicUrl
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Storage upload error' };
  }
}

export async function deleteFromStorage(
  bucket: BucketName | string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServerSupabaseClient();
  if (!supabase || !isServerSupabaseConfigured()) return { success: false };

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function getSignedStorageUrl(
  bucket: BucketName | string,
  path: string,
  expiresInSeconds: number = 3600
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  const supabase = getServerSupabaseClient();
  if (!supabase || !isServerSupabaseConfigured()) {
    return { success: false, error: 'Supabase client not configured.' };
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return { success: false, error: error?.message || 'Could not generate signed URL' };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
