import { NextResponse } from "next/server";
import {
  forbiddenResponse,
  hashPassword,
  normalizeUser,
  parseOptionalPassword,
  parseRole,
  requireAdmin,
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
    const password = parseOptionalPassword(body.password);
    const rol = parseRole(body.rol);

    const user = await prisma.usuario.update({
      where: { id },
      data: {
        usuario,
        rol,
        ...(password ? { passwordHash: hashPassword(password) } : {}),
      },
      select: {
        id: true,
        usuario: true,
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
