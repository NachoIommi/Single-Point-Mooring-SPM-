import { NextRequest, NextResponse } from 'next/server';
import { operacionService } from '@/services';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await operacionService.iniciarOperacion(Number(id));
    return NextResponse.json({ success: true, estado: 'ENCURSO' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}