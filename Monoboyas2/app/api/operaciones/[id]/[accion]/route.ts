import { NextResponse } from "next/server";
import { operacionService } from "@/services";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; accion: string }> }
) {
  const { id, accion: accionRaw } = await params;
  const opId = parseInt(id, 10);
  const accion = accionRaw.toLowerCase();

  if (isNaN(opId)) {
    return NextResponse.json({ error: "ID de operación inválido" }, { status: 400 });
  }

  try {
    switch (accion) {
      case "preparar":
        await operacionService.prepararOperacion(opId);
        break;
      case "iniciar":
        await operacionService.iniciarOperacion(opId);
        break;
      case "detener":
        await operacionService.detenerOperacion(opId);
        break;
      case "reanudar":
        await operacionService.reanudarOperacion(opId);
        break;
      case "finalizar":
        await operacionService.finalizarOperacion(opId);
        break;
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Operación ${accion} con éxito` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
