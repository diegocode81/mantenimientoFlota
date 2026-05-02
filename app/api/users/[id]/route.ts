import { NextResponse } from "next/server";
import {
  forbiddenResponse,
  hashPassword,
  normalizeEmail,
  normalizeUser,
  parseOptionalPassword,
  parseRole,
  requireAdmin,
  requireText,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return forbiddenResponse();

  const { id } = await context.params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const usuario = normalizeUser(body.usuario);
    const nombre = requireText(body.nombre, "nombre");
    const apellido = requireText(body.apellido, "apellido");
    const correo = normalizeEmail(body.correo);
    const password = parseOptionalPassword(body.password);
    const rol = parseRole(body.rol);

    const user = await prisma.usuario.update({
      where: { id },
      data: {
        usuario,
        nombre,
        apellido,
        correo,
        rol,
        ...(password ? { passwordHash: hashPassword(password) } : {}),
      },
      select: {
        id: true,
        usuario: true,
        nombre: true,
        apellido: true,
        correo: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar usuario.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return forbiddenResponse();

  const { id } = await context.params;

  try {
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar el usuario." },
      { status: 400 },
    );
  }
}
