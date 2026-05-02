import { NextResponse } from "next/server";
import {
  forbiddenResponse,
  requireAdmin,
  requireSession,
  unauthorizedResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFleetInput } from "@/lib/vehicles";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const data = parseFleetInput(await request.json());
    const vehicle = await prisma.vehiculo.update({
      where: { id },
      data,
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo actualizar.",
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
    await prisma.vehiculo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar el registro." },
      { status: 400 },
    );
  }
}
