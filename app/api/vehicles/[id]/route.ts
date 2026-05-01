import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVehicleInput } from "@/lib/vehicles";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const data = parseVehicleInput(await request.json());
    const vehicle = await prisma.vehiculoMantenimiento.update({
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
  const { id } = await context.params;

  try {
    await prisma.vehiculoMantenimiento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar el registro." },
      { status: 400 },
    );
  }
}
