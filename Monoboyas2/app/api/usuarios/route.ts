import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/persistence/lib/prisma";

const VALID_ROLES = [
  "ADMIN",
  "OPERADOR_PLANTA",
  "OPERADOR_BUQUE",
  "OPERADOR_LANCHA",
] as const;

type Rol = (typeof VALID_ROLES)[number];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const nombre = String(body.nombre ?? "").trim();
  const dni = Number(body.dni);
  const contrasena = String(body.contrasena ?? "").trim();
  const rol = String(body.rol ?? "").trim() as Rol;

  if (!nombre || !dni || !contrasena || !VALID_ROLES.includes(rol)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Nombre, DNI, contraseña y rol son requeridos.",
        },
      },
      { status: 400 }
    );
  }

  const email = `user-${dni}@spm.local`;

  try {
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        dni,
        contrasena,
        rol: rol as any,
      },
    });

    return NextResponse.json({ id: usuario.id }, { status: 201 });
  } catch (error) {
    const err = error as any;
    if (err?.code === "P2002") {
      return NextResponse.json(
        {
          error: {
            code: "DNI_YA_REGISTRADO",
            message: "Ya existe un usuario con ese DNI.",
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "UNKNOWN_ERROR",
          message: err?.message ?? "No se pudo crear el usuario.",
        },
      },
      { status: 500 }
    );
  }
}