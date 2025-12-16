import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    hasVimeoToken: !!process.env.VIMEO_ACCESS_TOKEN,
    hasVimeoClientId: !!process.env.VIMEO_CLIENT_ID,
    hasVimeoSecret: !!process.env.VIMEO_CLIENT_SECRET,
    tokenLength: process.env.VIMEO_ACCESS_TOKEN?.length || 0,
    apiVersion: process.env.NEXT_PUBLIC_VIMEO_API_VERSION || 'not set',
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL2,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY2,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'not set',
  };

  return NextResponse.json(envCheck);
}