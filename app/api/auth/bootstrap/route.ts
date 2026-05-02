import { RolUsuario } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  hashPassword,
  normalizeEmail,
  normalizeUser,
  parsePassword,
  requireText,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const count = await prisma.usuario.count();
    if (count > 0) {
      return NextResponse.json(
        { error: "El sistema ya tiene usuarios registrados." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const usuario = normalizeUser(body.usuario);
    const nombre = requireText(body.nombre, "nombre");
    const apellido = requireText(body.apellido, "apellido");
    const correo = normalizeEmail(body.correo);
    const password = parsePassword(body.password);

    const user = await prisma.usuario.create({
      data: {
        usuario,
        nombre,
        apellido,
        correo,
        passwordHash: hashPassword(password),
        rol: RolUsuario.ADMINISTRADOR,
      },
      select: {
        id: true,
        usuario: true,
        nombre: true,
        apellido: true,
        correo: true,
        rol: true,
      },
    });

    const response = NextResponse.json({ user }, { status: 201 });
    await setSessionCookie(response, user);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el administrador.",
      },
      { status: 400 },
    );
  }
}
