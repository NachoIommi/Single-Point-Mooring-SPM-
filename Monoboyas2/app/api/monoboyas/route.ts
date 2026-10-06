import { NextResponse } from "next/server";
import { prisma } from "@/persistence/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    // En nuestro dominio la monoboya no tiene plantaId de momento,
    // pero si lo tuviera, lo filtraríamos aquí.

    const where = estado ? { estado: estado as any } : {};
    
    const monoboyas = await prisma.monoboya.findMany({
      where
    });

    return NextResponse.json(monoboyas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
