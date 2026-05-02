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

    const startOfDay = new Date(data.fechaMantenimiento);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data.fechaMantenimiento);
    endOfDay.setHours(23, 59, 59, 999);

    if (data.estado === "MANTENIMIENTO") {
      const existingMaintenance = await prisma.mantenimientoVehiculo.findFirst({
        where: {
          vehiculoId: data.vehiculoId,
          estado: "MANTENIMIENTO",
          fechaMantenimiento: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          vehiculo: true,
        },
      });

      if (existingMaintenance) {
        return NextResponse.json(
          {
            error:
              "Este vehículo ya se encuentra registrado en mantenimiento para esta fecha.",
          },
          { status: 400 },
        );
      }
    }

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