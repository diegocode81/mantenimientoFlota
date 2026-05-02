import { NextResponse } from "next/server";
import {
  forbiddenResponse,
  hashPassword,
  normalizeUser,
  parsePassword,
  parseRole,
  requireAdmin,
  unauthorizedResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse();

  try {
    const users = await prisma.usuario.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        usuario: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: "No se pudieron cargar los usuarios." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const usuario = normalizeUser(body.usuario);
    const password = parsePassword(body.password);
    const rol = parseRole(body.rol);

    const user = await prisma.usuario.create({
      data: {
        usuario,
        passwordHash: hashPassword(password),
        rol,
      },
      select: {
        id: true,
        usuario: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo crear usuario.",
      },
      { status: 400 },
    );
  }
}
