import { NextResponse } from 'next/server';

/**
 * Safety net: Iyzico callbacks belong on myunilab (myuni-new-v2), not this
 * admin dashboard. When both apps share localhost:3000 in local dev, Iyzico
 * can POST here instead. Without this route + middleware exclusion, Clerk
 * intercepts the POST and returns handshake 405 (dev-browser-missing).
 */
export async function POST() {
  console.error(
    '[iyzico-callback] Received on Uniboard — payment callback hit the wrong host. Point NEXT_PUBLIC_BASE_URL / callback at myuni, and run myuni on that port.'
  );
  return NextResponse.json(
    {
      error: 'iyzico_callback_wrong_host',
      message:
        'Payment callbacks must be handled by myunilab.net (or local myuni). This is the admin dashboard.',
    },
    { status: 502 }
  );
}

export async function GET() {
  return POST();
}
