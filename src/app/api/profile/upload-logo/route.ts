import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type — SVG removed because malicious SVGs in a public bucket
    // can execute scripts when rendered inline (XSS). If SVG support is required,
    // sanitize server-side with DOMPurify before storing.
    const allowedTypes: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    if (!Object.prototype.hasOwnProperty.call(allowedTypes, file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG or WebP.' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 2MB.' }, { status: 400 });
    }

    // Derive extension from the validated MIME type (never trust file.name).
    const ext = allowedTypes[file.type];
    const filePath = `${user.id}/logo.${ext}`;

    // Convert File to ArrayBuffer then to Uint8Array for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage (upsert to replace existing)
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Logo upload storage error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // Update profile with logo URL
    await supabase
      .from('briefing_profiles')
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({ url: logoUrl });
  } catch (err) {
    console.error('Logo upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
