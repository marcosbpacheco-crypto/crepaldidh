import { NextResponse } from 'next/server';
import { loadModuleFromSupabase, saveModuleToSupabase } from '@/lib/syncService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ moduleKey: string }> }
) {
  try {
    const resolvedParams = await params;
    const moduleKey = resolvedParams.moduleKey;
    
    if (!moduleKey) {
      return NextResponse.json({ error: 'Missing moduleKey' }, { status: 400 });
    }

    const data = await loadModuleFromSupabase(moduleKey);
    const clientCount = data?.clients?.length ?? 0;
    const companyCount = data?.companies?.length ?? 0;
    console.log(`[AUDIT-API] GET /api/sync/${moduleKey} — clients:${clientCount} companies:${companyCount}`, data ? Object.keys(data) : 'null');
    return NextResponse.json({ data: data || {} });
  } catch (error: any) {
    console.error(`API GET /sync error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to load module' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleKey: string }> }
) {
  try {
    const resolvedParams = await params;
    const moduleKey = resolvedParams.moduleKey;
    
    if (!moduleKey) {
      return NextResponse.json({ error: 'Missing moduleKey' }, { status: 400 });
    }

    const body = await request.json();
    const { merged } = body;

    if (!merged) {
      return NextResponse.json({ error: 'Missing merged data in request body' }, { status: 400 });
    }

    console.log(`[AUDIT-API] POST /api/sync/${moduleKey} — keys: ${Object.keys(merged).join(', ')}`);
    await saveModuleToSupabase(moduleKey, merged);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API POST /sync error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to save module' }, { status: 500 });
  }
}
