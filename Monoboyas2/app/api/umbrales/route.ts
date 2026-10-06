import { NextRequest, NextResponse } from 'next/server';
import { getUmbrales, setUmbrales } from '@/app/lib/umbrales-store';

export async function GET() {
  return NextResponse.json(getUmbrales());
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(setUmbrales(body));
}