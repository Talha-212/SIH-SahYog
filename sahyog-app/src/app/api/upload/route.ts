import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name) || '.jpg';
      const fileName = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      return NextResponse.json({
        success: true,
        url: `/uploads/${fileName}`,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }

    // JSON base64 fallback
    const body = await request.json();
    if (body.dataUrl) {
      const matches = body.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ success: false, error: 'Invalid data URL' }, { status: 400 });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const ext = matches[1].includes('png') ? '.png' : '.jpg';
      const fileName = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      return NextResponse.json({
        success: true,
        url: `/uploads/${fileName}`,
        name: body.name || fileName
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported format' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
