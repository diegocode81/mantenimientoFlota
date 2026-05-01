import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFleetInput } from "@/lib/vehicles";

export async function GET() {
  try {
    const vehicles = await prisma.vehiculo.findMany({
      orderBy: [{ placa: "asc" }],
      include: {
        _count: {
          select: { mantenimientos: true },
        },
      },
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
    const data = parseFleetInput(await request.json());
    const vehicle = await prisma.vehiculo.create({ data });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear." },
      { status: 400 },
    );
  }
}
