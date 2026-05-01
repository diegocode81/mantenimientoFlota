import { EstadoVehiculo } from "@prisma/client";

export type VehicleInput = {
  placa: string;
  disco: string;
  marca: string;
  tipo: string;
  ano: number;
  cia: string;
  fechaMantenimiento: Date;
  estado: EstadoVehiculo;
  observaciones?: string | null;
  rutaUbicacion: string;
  tecnicosDesignados: string;
};

const requiredStringFields = [
  "placa",
  "disco",
  "marca",
  "tipo",
  "cia",
  "rutaUbicacion",
  "tecnicosDesignados",
] as const;

export function parseVehicleInput(body: unknown): VehicleInput {
  if (!body || typeof body !== "object") {
    throw new Error("Datos inválidos.");
  }

  const data = body as Record<string, unknown>;

  for (const field of requiredStringFields) {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      throw new Error(`El campo ${field} es obligatorio.`);
    }
  }

  const ano = Number(data.ano);
  if (!Number.isInteger(ano) || ano < 1900 || ano > 2100) {
    throw new Error("El año debe ser un número válido.");
  }

  if (
    data.estado !== EstadoVehiculo.OPERATIVO &&
    data.estado !== EstadoVehiculo.MANTENIMIENTO
  ) {
    throw new Error("El estado debe ser operativo o mantenimiento.");
  }

  if (typeof data.fechaMantenimiento !== "string" || !data.fechaMantenimiento) {
    throw new Error("La fecha de mantenimiento es obligatoria.");
  }

  const fechaMantenimiento = new Date(`${data.fechaMantenimiento}T00:00:00`);
  if (Number.isNaN(fechaMantenimiento.getTime())) {
    throw new Error("La fecha de mantenimiento no es válida.");
  }

  return {
    placa: String(data.placa).trim().toUpperCase(),
    disco: String(data.disco).trim(),
    marca: String(data.marca).trim(),
    tipo: String(data.tipo).trim(),
    ano,
    cia: String(data.cia).trim(),
    fechaMantenimiento,
    estado: data.estado,
    observaciones:
      typeof data.observaciones === "string" && data.observaciones.trim()
        ? data.observaciones.trim()
        : null,
    rutaUbicacion: String(data.rutaUbicacion).trim(),
    tecnicosDesignados: String(data.tecnicosDesignados).trim(),
  };
}
