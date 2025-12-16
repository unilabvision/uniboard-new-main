import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    hasVimeoToken: !!process.env.VIMEO_ACCESS_TOKEN,
    hasVimeoClientId: !!process.env.VIMEO_CLIENT_ID,
    hasVimeoSecret: !!process.env.VIMEO_CLIENT_SECRET,
    tokenLength: process.env.VIMEO_ACCESS_TOKEN?.length || 0,
    apiVersion: process.env.NEXT_PUBLIC_VIMEO_API_VERSION || 'not set',
  };

  return NextResponse.json(envCheck);
}