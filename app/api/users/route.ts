import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { RolUsuario } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeUser(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("El usuario es obligatorio.");
  }

  return value.trim().toLowerCase();
}

function parsePassword(value: unknown) {
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

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET() {
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
