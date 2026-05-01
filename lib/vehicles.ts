import { EstadoVehiculo, TipoMantenimiento } from "@prisma/client";

export type FleetInput = {
  placa: string;
  disco: string;
  marca: string;
  tipo: string;
  ano: number;
  cia: string;
};

export type MaintenanceInput = {
  vehiculoId: string;
  fechaMantenimiento: Date;
  estado: EstadoVehiculo;
  kilometrajeOdometro: number;
  tipoMantenimiento: TipoMantenimiento;
  rutaUbicacion: string;
  tecnicosDesignados: string;
  observaciones?: string | null;
};

const fleetFields = ["placa", "disco", "marca", "tipo", "cia"] as const;

function requireText(data: Record<string, unknown>, field: string) {
  if (typeof data[field] !== "string" || !data[field].trim()) {
    throw new Error(`El campo ${field} es obligatorio.`);
  }

  return data[field].trim();
}

export function parseFleetInput(body: unknown): FleetInput {
  if (!body || typeof body !== "object") {
    throw new Error("Datos invalidos.");
  }

  const data = body as Record<string, unknown>;
  for (const field of fleetFields) {
    requireText(data, field);
  }

  const ano = Number(data.ano);
  if (!Number.isInteger(ano) || ano < 1900 || ano > 2100) {
    throw new Error("El año debe ser un numero valido.");
  }

  return {
    placa: requireText(data, "placa").toUpperCase(),
    disco: requireText(data, "disco"),
    marca: requireText(data, "marca"),
    tipo: requireText(data, "tipo"),
    ano,
    cia: requireText(data, "cia"),
  };
}

export function parseMaintenanceInput(body: unknown): MaintenanceInput {
  if (!body || typeof body !== "object") {
    throw new Error("Datos invalidos.");
  }

  const data = body as Record<string, unknown>;
  const vehiculoId = requireText(data, "vehiculoId");
  const rutaUbicacion = requireText(data, "rutaUbicacion");
  const tecnicosDesignados = requireText(data, "tecnicosDesignados");
  const kilometrajeOdometro = Number(data.kilometrajeOdometro);

  if (
    !Number.isInteger(kilometrajeOdometro) ||
    kilometrajeOdometro < 0 ||
    kilometrajeOdometro > 9999999
  ) {
    throw new Error("El kilometraje/odometro debe ser un numero valido.");
  }

  if (
    data.estado !== EstadoVehiculo.OPERATIVO &&
    data.estado !== EstadoVehiculo.MANTENIMIENTO
  ) {
    throw new Error("El estado debe ser operativo o mantenimiento.");
  }

  if (
    data.tipoMantenimiento !== TipoMantenimiento.CORRECTIVO &&
    data.tipoMantenimiento !== TipoMantenimiento.PREVENTIVO &&
    data.tipoMantenimiento !== TipoMantenimiento.PROACTIVO
  ) {
    throw new Error("El tipo de mantenimiento no es valido.");
  }

  if (typeof data.fechaMantenimiento !== "string" || !data.fechaMantenimiento) {
    throw new Error("La fecha de mantenimiento es obligatoria.");
  }

  const fechaMantenimiento = new Date(`${data.fechaMantenimiento}T00:00:00`);
  if (Number.isNaN(fechaMantenimiento.getTime())) {
    throw new Error("La fecha de mantenimiento no es valida.");
  }

  return {
    vehiculoId,
    fechaMantenimiento,
    estado: data.estado,
    kilometrajeOdometro,
    tipoMantenimiento: data.tipoMantenimiento,
    rutaUbicacion,
    tecnicosDesignados,
    observaciones:
      typeof data.observaciones === "string" && data.observaciones.trim()
        ? data.observaciones.trim()
        : null,
  };
}
