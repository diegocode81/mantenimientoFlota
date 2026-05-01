import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVehicleInput } from "@/lib/vehicles";

export async function GET() {
  try {
    const vehicles = await prisma.vehiculoMantenimiento.findMany({
      orderBy: [{ fechaMantenimiento: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(vehicles);
  } catch {
    return NextResponse.json(
      { error: "No se pudieron cargar los registros." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = parseVehicleInput(await request.json());
    const vehicle = await prisma.vehiculoMantenimiento.create({ data });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear." },
      { status: 400 },
    );
  }
}
