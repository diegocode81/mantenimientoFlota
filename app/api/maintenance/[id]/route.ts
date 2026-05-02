import { NextResponse } from "next/server";
import {
  forbiddenResponse,
  requireAdmin,
  requireSession,
  unauthorizedResponse,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseMaintenanceInput } from "@/lib/vehicles";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const data = parseMaintenanceInput(await request.json());
    const record = await prisma.mantenimientoVehiculo.update({
      where: { id },
      data,
      include: { vehiculo: true },
    });

    return NextResponse.json(record);
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
    await prisma.mantenimientoVehiculo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar el mantenimiento." },
      { status: 400 },
    );
  }
}
