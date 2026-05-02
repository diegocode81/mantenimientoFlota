import { randomBytes, scryptSync } from "crypto";
import { RolUsuario } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeUser(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("El usuario es obligatorio.");
  }

  return value.trim().toLowerCase();
}

function parseOptionalPassword(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || value.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  return value;
}

function parseRole(value: unknown) {
  if (value !== RolUsuario.ADMINISTRADOR && value !== RolUsuario.ANALISTA) {
    throw new Error("El perfil no es valido.");
  }

  return value;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function PUT(request: Request, context: RouteContext) {
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
