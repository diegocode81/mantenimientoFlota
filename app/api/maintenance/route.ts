import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMaintenanceInput } from "@/lib/vehicles";

export async function GET() {
  try {
    const records = await prisma.mantenimientoVehiculo.findMany({
      orderBy: [{ fechaMantenimiento: "desc" }, { createdAt: "desc" }],
      include: { vehiculo: true },
    });

    return NextResponse.json(records);
  } catch {
    return NextResponse.json(
      { error: "No se pudieron cargar los mantenimientos." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = parseMaintenanceInput(await request.json());
    const record = await prisma.mantenimientoVehiculo.create({
      data,
      include: { vehiculo: true },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear." },
      { status: 400 },
    );
  }
}
