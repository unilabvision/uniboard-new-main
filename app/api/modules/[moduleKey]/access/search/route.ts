import { NextRequest } from 'next/server';
import { getModuleAccessDefinition } from '@/app/lib/moduleAccess/registry';
import { searchModuleAccessUsers } from '@/app/lib/moduleAccess/handlers';

type RouteContext = { params: Promise<{ moduleKey: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { moduleKey } = await context.params;
  const def = getModuleAccessDefinition(moduleKey);
  if (!def) {
    return Response.json({ error: 'Unknown module' }, { status: 404 });
  }
  try {
    return await searchModuleAccessUsers(def, request);
  } catch (err) {
    console.error(`Module access search error (${moduleKey}):`, err);
    return Response.json({ error: 'Search failed' }, { status: 500 });
  }
}
