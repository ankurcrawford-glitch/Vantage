import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `SET (starts with ${process.env.GEMINI_API_KEY.substring(0, 4)}...)` : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
  });
}