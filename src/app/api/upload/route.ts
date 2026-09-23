import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import {
  BUCKETS,
  validateUploadFile,
  buildStoragePath,
  uploadToStorage,
  type BucketName
} from '@/lib/supabase/storage';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let buffer: Buffer;
    let originalName: string;
    let mimeType: string;
    let fileSize: number;
    let requestedBucket: BucketName | string = BUCKETS.PROBLEM_EVIDENCE;
    let entityId: string = 'unassigned';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file was provided for upload.' }, { status: 400 });
      }

      const formBucket = formData.get('bucket') as string | null;
      if (formBucket) requestedBucket = formBucket;

      const formEntityId = formData.get('problem_id') || formData.get('entity_id');
      if (formEntityId) entityId = String(formEntityId);

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      originalName = file.name || 'upload.jpg';
      mimeType = file.type || 'image/jpeg';
      fileSize = file.size;
    } else {
      // JSON base64 / dataUrl fallback (camera captures)
      const body = await request.json();
      if (!body.dataUrl) {
        return NextResponse.json({ success: false, error: 'No image or video data was provided.' }, { status: 400 });
      }

      if (body.bucket) requestedBucket = body.bucket;
      if (body.problem_id || body.entity_id) entityId = body.problem_id || body.entity_id;

      const matches = body.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ success: false, error: 'Invalid base64 data format.' }, { status: 400 });
      }

      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      const ext = mimeType.includes('png') ? '.png' : mimeType.includes('mp4') ? '.mp4' : mimeType.includes('webp') ? '.webp' : '.jpg';
      originalName = body.name || `capture_${Date.now()}${ext}`;
      fileSize = buffer.length;
    }

    // 1. Strict File Validation (MIME type and size limit)
    const validation = validateUploadFile(mimeType, fileSize);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 2. Structured Storage Path
    const storagePath = buildStoragePath(requestedBucket, entityId, originalName);

    // 3. Authoritative Upload to Supabase Storage
    const supabase = getServerSupabaseClient();
    if (supabase && isServerSupabaseConfigured()) {
      const uploadRes = await uploadToStorage({
        bucket: requestedBucket,
        path: storagePath,
        buffer,
        contentType: mimeType
      });

      if (uploadRes.success && uploadRes.url) {
        return NextResponse.json({
          success: true,
          url: uploadRes.url,
          path: storagePath,
          bucket: requestedBucket,
          name: originalName,
          size: fileSize,
          type: mimeType,
          storage: 'supabase_storage'
        });
      }

      console.warn('[SahYog Storage] Supabase Storage upload error:', uploadRes.error);
    }

    // 4. Local fallback storage for offline prototype testing
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', requestedBucket);
    await fs.mkdir(uploadsDir, { recursive: true });
    const localFileName = path.basename(storagePath);
    const localFilePath = path.join(uploadsDir, localFileName);
    await fs.writeFile(localFilePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${requestedBucket}/${localFileName}`,
      path: `${requestedBucket}/${localFileName}`,
      bucket: requestedBucket,
      name: originalName,
      size: fileSize,
      type: mimeType,
      storage: 'local_public_uploads'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Evidence upload failed.' },
      { status: 500 }
    );
  }
}
