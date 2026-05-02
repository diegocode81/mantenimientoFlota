import { NextResponse } from "next/server";
import {
  normalizeUser,
  parsePassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const usuario = normalizeUser(body.usuario);
    const password = parsePassword(body.password);

    const user = await prisma.usuario.findUnique({ where: { usuario } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      user: { id: user.id, usuario: user.usuario, rol: user.rol },
    });
    setSessionCookie(response, {
      id: user.id,
      usuario: user.usuario,
      rol: user.rol,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo iniciar sesion.",
      },
      { status: 400 },
    );
  }
}
