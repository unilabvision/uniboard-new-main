import { NextRequest } from 'next/server';
import { getModuleAccessDefinition } from '@/app/lib/moduleAccess/registry';
import {
  grantModuleAccessMember,
  listModuleAccessMembers,
  revokeModuleAccessMember,
} from '@/app/lib/moduleAccess/handlers';

type RouteContext = { params: Promise<{ moduleKey: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { moduleKey } = await context.params;
  const def = getModuleAccessDefinition(moduleKey);
  if (!def) {
    return Response.json({ error: 'Unknown module' }, { status: 404 });
  }
  try {
    return await listModuleAccessMembers(def);
  } catch (err) {
    console.error(`Module access list error (${moduleKey}):`, err);
    return Response.json({ error: 'Failed to list access' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { moduleKey } = await context.params;
  const def = getModuleAccessDefinition(moduleKey);
  if (!def) {
    return Response.json({ error: 'Unknown module' }, { status: 404 });
  }
  try {
    return await grantModuleAccessMember(def, request);
  } catch (err) {
    console.error(`Module access grant error (${moduleKey}):`, err);
    let message: string | null = null;
    if (err instanceof Error && err.message) {
      message = err.message;
    } else if (err && typeof err === 'object') {
      const e = err as {
        message?: string;
        details?: string;
        errors?: Array<{ longMessage?: string; message?: string }>;
      };
      message =
        e.errors?.[0]?.longMessage ||
        e.errors?.[0]?.message ||
        e.message ||
        e.details ||
        null;
    }
    return Response.json(
      { error: message || 'Grant failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { moduleKey } = await context.params;
  const def = getModuleAccessDefinition(moduleKey);
  if (!def) {
    return Response.json({ error: 'Unknown module' }, { status: 404 });
  }
  try {
    return await revokeModuleAccessMember(def, request);
  } catch (err) {
    console.error(`Module access revoke error (${moduleKey}):`, err);
    return Response.json({ error: 'Revoke failed' }, { status: 500 });
  }
}
