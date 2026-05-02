"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EstadoVehiculo = "OPERATIVO" | "MANTENIMIENTO";
type TipoMantenimiento = "CORRECTIVO" | "PREVENTIVO" | "PROACTIVO";
type Tab = "FLOTA" | "MANTENIMIENTOS" | "DASHBOARD";

type FleetVehicle = {
  id: string;
  itemOrigen: string | null;
  placa: string | null;
  disco: string | null;
  marca: string | null;
  tipo: string;
  ano: number | null;
  anoOriginal: string | null;
  cia: string | null;
  chofer: string | null;
  _count?: { mantenimientos: number };
};

type MaintenanceRecord = {
  id: string;
  vehiculoId: string;
  fechaMantenimiento: string;
  estado: EstadoVehiculo;
  kilometrajeOdometro: number;
  tipoMantenimiento: TipoMantenimiento | null;
  rutaUbicacion: string;
  tecnicosDesignados: string;
  observaciones: string | null;
  vehiculo: FleetVehicle;
};

type FleetForm = {
  placa: string;
  disco: string;
  marca: string;
  tipo: string;
  ano: number | "";
  cia: string;
  chofer: string;
};

type MaintenanceForm = {
  vehiculoId: string;
  fechaMantenimiento: string;
  estado: EstadoVehiculo;
  kilometrajeOdometro: number;
  tipoMantenimiento: TipoMantenimiento;
  rutaUbicacion: string;
  tecnicosDesignados: string;
  observaciones: string;
};

const emptyFleetForm: FleetForm = {
  placa: "",
  disco: "",
  marca: "",
  tipo: "",
  ano: new Date().getFullYear(),
  cia: "",
  chofer: "",
};

const emptyMaintenanceForm: MaintenanceForm = {
  vehiculoId: "",
  fechaMantenimiento: new Date().toISOString().slice(0, 10),
  estado: "OPERATIVO",
  kilometrajeOdometro: 0,
  tipoMantenimiento: "PREVENTIVO",
  rutaUbicacion: "",
  tecnicosDesignados: "",
  observaciones: "",
};

const PAGE_SIZE = 10;

function dateForInput(value: string) {
  return value.slice(0, 10);
}

function getPageCount(total: number) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

function getPageRange(page: number, total: number) {
  if (total === 0) return "0 de 0";
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  return `${start}-${end} de ${total}`;
}

function percent(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function formatTipoMantenimiento(
  estado: EstadoVehiculo,
  tipo: TipoMantenimiento | null,
) {
  if (estado === "OPERATIVO") return "No aplica";
  if (tipo === "CORRECTIVO") return "Correctivo";
  if (tipo === "PREVENTIVO") return "Preventivo";
  if (tipo === "PROACTIVO") return "Proactivo";
  return "No aplica";
}

function isErrorMessage(message: string) {
  const text = message.toLowerCase();
  return (
    text.includes("no se pudo") ||
    text.includes("ya se encuentra") ||
    text.includes("error") ||
    text.includes("obligatorio") ||
    text.includes("invalido") ||
    text.includes("inválido")
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("FLOTA");
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([]);
  const [fleetForm, setFleetForm] = useState<FleetForm>(emptyFleetForm);
  const [maintenanceForm, setMaintenanceForm] =
    useState<MaintenanceForm>(emptyMaintenanceForm);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<
    string | null
  >(null);
  const [fleetSearch, setFleetSearch] = useState("");
  const [maintenanceSearch, setMaintenanceSearch] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | EstadoVehiculo>(
    "TODOS",
  );
  const [fleetPage, setFleetPage] = useState(1);
  const [maintenancePage, setMaintenancePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    const [vehiclesResponse, maintenanceResponse] = await Promise.all([
      fetch("/api/vehicles"),
      fetch("/api/maintenance"),
    ]);
    const [vehiclesData, maintenanceData] = await Promise.all([
      vehiclesResponse.json(),
      maintenanceResponse.json(),
    ]);
    setLoading(false);

    if (!vehiclesResponse.ok) {
      setMessage(vehiclesData.error ?? "No se pudo cargar la flota.");
      return;
    }

    if (!maintenanceResponse.ok) {
      setMessage(
        maintenanceData.error ?? "No se pudieron cargar los mantenimientos.",
      );
      return;
    }

    setVehicles(vehiclesData);
    setMaintenanceRecords(maintenanceData);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredVehicles = useMemo(() => {
    const term = fleetSearch.trim().toLowerCase();
    if (!term) return vehicles;

    return vehicles.filter((vehicle) =>
      [vehicle.placa, vehicle.disco, vehicle.marca, vehicle.tipo, vehicle.cia, vehicle.chofer]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [vehicles, fleetSearch]);

  const filteredMaintenance = useMemo(() => {
    const term = maintenanceSearch.trim().toLowerCase();

    return maintenanceRecords
      .filter((record) => {
        const matchesStatus =
          statusFilter === "TODOS" || record.estado === statusFilter;
        const recordDate = dateForInput(record.fechaMantenimiento);
        const matchesDate = !maintenanceDate || recordDate === maintenanceDate;
        const matchesSearch =
          !term ||
          [
            recordDate,
            record.vehiculo.placa,
            record.vehiculo.disco,
            record.vehiculo.marca,
            String(record.kilometrajeOdometro),
            formatTipoMantenimiento(record.estado, record.tipoMantenimiento),
            record.rutaUbicacion,
            record.tecnicosDesignados,
            record.observaciones ?? "",
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term);

        return matchesStatus && matchesDate && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.fechaMantenimiento).getTime() -
          new Date(a.fechaMantenimiento).getTime(),
      );
  }, [maintenanceRecords, maintenanceSearch, maintenanceDate, statusFilter]);

  const latestVehicleRecords = useMemo(() => {
    const latestByVehicle = new Map<string, MaintenanceRecord>();

    for (const record of maintenanceRecords) {
      const current = latestByVehicle.get(record.vehiculoId);
      if (
        !current ||
        new Date(record.fechaMantenimiento).getTime() >
          new Date(current.fechaMantenimiento).getTime()
      ) {
        latestByVehicle.set(record.vehiculoId, record);
      }
    }

    return Array.from(latestByVehicle.values());
  }, [maintenanceRecords]);

  const latestStatusSummary = useMemo(() => {
    const inMaintenance = latestVehicleRecords.filter(
      (record) => record.estado === "MANTENIMIENTO",
    ).length;
    const operative = latestVehicleRecords.filter(
      (record) => record.estado === "OPERATIVO",
    ).length;

    return { inMaintenance, operative };
  }, [latestVehicleRecords]);

  const dashboardStats = useMemo(() => {
    const latestDate =
      latestVehicleRecords
        .map((record) => dateForInput(record.fechaMantenimiento))
        .sort()
        .at(-1) ?? "";

    const availability = percent(
      latestStatusSummary.operative,
      vehicles.length,
    );

    const byCia = Array.from(
      vehicles.reduce((map, vehicle) => {
        const key = vehicle.cia || "Sin CIA";
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    ).sort((a, b) => b[1] - a[1]);

    const byType = Array.from(
      maintenanceRecords.reduce((map, record) => {
        if (record.estado === "OPERATIVO") return map;

        const key = formatTipoMantenimiento(
          record.estado,
          record.tipoMantenimiento,
        );

        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    ).sort((a, b) => b[1] - a[1]);

    const trend = Array.from(
      maintenanceRecords.reduce((map, record) => {
        const key = dateForInput(record.fechaMantenimiento);
        const current = map.get(key) ?? { operativo: 0, mantenimiento: 0 };
        if (record.estado === "OPERATIVO") current.operativo += 1;
        if (record.estado === "MANTENIMIENTO") current.mantenimiento += 1;
        map.set(key, current);
        return map;
      }, new Map<string, { operativo: number; mantenimiento: number }>()),
    ).sort((a, b) => a[0].localeCompare(b[0]));

    const topObservations = Array.from(
      maintenanceRecords.reduce((map, record) => {
        const key = record.observaciones?.trim();
        if (!key) return map;
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const latestMaintenanceVehicles = latestVehicleRecords
      .filter((record) => record.estado === "MANTENIMIENTO")
      .sort((a, b) =>
        (a.vehiculo.placa ?? "").localeCompare(b.vehiculo.placa ?? ""),
      )
      .slice(0, 8);

    return {
      availability,
      byCia,
      byType,
      latestDate,
      latestMaintenanceVehicles,
      topObservations,
      trend,
    };
  }, [
    latestStatusSummary.operative,
    latestVehicleRecords,
    maintenanceRecords,
    vehicles,
  ]);

  const fleetPageCount = getPageCount(filteredVehicles.length);
  const maintenancePageCount = getPageCount(filteredMaintenance.length);

  const paginatedVehicles = useMemo(() => {
    const start = (fleetPage - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, fleetPage]);

  const paginatedMaintenance = useMemo(() => {
    const start = (maintenancePage - 1) * PAGE_SIZE;
    return filteredMaintenance.slice(start, start + PAGE_SIZE);
  }, [filteredMaintenance, maintenancePage]);

  const vehiclesAvailableForDate = useMemo(() => {
    const selectedDate = maintenanceForm.fechaMantenimiento;

    const registeredVehicleIds = new Set(
      maintenanceRecords
        .filter(
          (record) =>
            dateForInput(record.fechaMantenimiento) === selectedDate &&
            record.id !== editingMaintenanceId,
        )
        .map((record) => record.vehiculoId),
    );

    return vehicles.filter((vehicle) => !registeredVehicleIds.has(vehicle.id));
  }, [
    vehicles,
    maintenanceRecords,
    maintenanceForm.fechaMantenimiento,
    editingMaintenanceId,
  ]);

  useEffect(() => {
    setFleetPage(1);
  }, [fleetSearch]);

  useEffect(() => {
    setMaintenancePage(1);
  }, [maintenanceSearch, maintenanceDate, statusFilter]);

  useEffect(() => {
    setFleetPage((page) => Math.min(page, fleetPageCount));
  }, [fleetPageCount]);

  useEffect(() => {
    setMaintenancePage((page) => Math.min(page, maintenancePageCount));
  }, [maintenancePageCount]);

  function updateFleetField<K extends keyof FleetForm>(
    field: K,
    value: FleetForm[K],
  ) {
    setFleetForm((current) => ({ ...current, [field]: value }));
  }

  function updateMaintenanceField<K extends keyof MaintenanceForm>(
    field: K,
    value: MaintenanceForm[K],
  ) {
    setMaintenanceForm((current) => ({ ...current, [field]: value }));
  }

  function resetFleetForm() {
    setFleetForm(emptyFleetForm);
    setEditingVehicleId(null);
    setMessage("");
  }

  function resetMaintenanceForm() {
    setMaintenanceForm({
      ...emptyMaintenanceForm,
      vehiculoId: vehicles[0]?.id ?? "",
    });
    setEditingMaintenanceId(null);
    setMessage("");
  }

  useEffect(() => {
    if (!maintenanceForm.vehiculoId && vehicles[0]?.id) {
      updateMaintenanceField("vehiculoId", vehicles[0].id);
    }
  }, [maintenanceForm.vehiculoId, vehicles]);

  async function submitFleet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch(
      editingVehicleId ? `/api/vehicles/${editingVehicleId}` : "/api/vehicles",
      {
        method: editingVehicleId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fleetForm),
      },
    );

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo guardar el vehiculo.");
      return;
    }

    resetFleetForm();
    setMessage(editingVehicleId ? "Vehiculo actualizado." : "Vehiculo creado.");
    await loadData();
  }

  async function submitMaintenance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      ...maintenanceForm,
      tipoMantenimiento:
        maintenanceForm.estado === "OPERATIVO"
          ? null
          : maintenanceForm.tipoMantenimiento,
    };

    const response = await fetch(
      editingMaintenanceId
        ? `/api/maintenance/${editingMaintenanceId}`
        : "/api/maintenance",
      {
        method: editingMaintenanceId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(
        data.error ||
          "Este vehículo ya se encuentra registrado en mantenimiento para esta fecha.",
      );
      return;
    }

    resetMaintenanceForm();

    setMessage(
      editingMaintenanceId
        ? "Mantenimiento actualizado correctamente."
        : "Mantenimiento creado correctamente.",
    );

    await loadData();
  }

  function startFleetEdit(vehicle: FleetVehicle) {
    setEditingVehicleId(vehicle.id);
    setFleetForm({
      placa: vehicle.placa ?? "",
      disco: vehicle.disco ?? "",
      marca: vehicle.marca ?? "",
      tipo: vehicle.tipo,
      ano: vehicle.ano ?? "",
      cia: vehicle.cia ?? "",
      chofer: vehicle.chofer ?? "",
    });
    setActiveTab("FLOTA");
    setMessage("Editando vehiculo seleccionado.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startMaintenanceEdit(record: MaintenanceRecord) {
    setEditingMaintenanceId(record.id);
    setMaintenanceForm({
      vehiculoId: record.vehiculoId,
      fechaMantenimiento: dateForInput(record.fechaMantenimiento),
      estado: record.estado,
      kilometrajeOdometro: record.kilometrajeOdometro,
      tipoMantenimiento: record.tipoMantenimiento ?? "PREVENTIVO",
      rutaUbicacion: record.rutaUbicacion,
      tecnicosDesignados: record.tecnicosDesignados,
      observaciones: record.observaciones ?? "",
    });
    setActiveTab("MANTENIMIENTOS");
    setMessage("Editando mantenimiento seleccionado.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteVehicle(vehicle: FleetVehicle) {
    const confirmed = window.confirm(
      `Eliminar el vehiculo ${vehicle.placa ?? "sin placa"}? Tambien se eliminaran sus mantenimientos.`,
    );
    if (!confirmed) return;

    const response = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo eliminar el vehiculo.");
      return;
    }

    setMessage("Vehiculo eliminado.");
    await loadData();
  }

  async function deleteMaintenance(record: MaintenanceRecord) {
    const confirmed = window.confirm(
      `Eliminar el mantenimiento de ${record.vehiculo.placa ?? "sin placa"}?`,
    );
    if (!confirmed) return;

    const response = await fetch(`/api/maintenance/${record.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo eliminar el mantenimiento.");
      return;
    }

    setMessage("Mantenimiento eliminado.");
    await loadData();
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div className="brandTitle">
          <span className="brandIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M5.4 11.2 7 6.9A3 3 0 0 1 9.8 5h4.4A3 3 0 0 1 17 6.9l1.6 4.3A3 3 0 0 1 21 14v3h-2.1a2.5 2.5 0 0 1-4.8 0H9.9a2.5 2.5 0 0 1-4.8 0H3v-3a3 3 0 0 1 2.4-2.8Zm2.2-.2h8.8l-1.2-3.3a1 1 0 0 0-1-.7H9.8a1 1 0 0 0-1 .7L7.6 11ZM7.5 18a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm9 0a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1ZM5 15h14v-1a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v1Z" />
            </svg>
          </span>
          <div>
            <p className="eyebrow">Control operativo</p>
            <h1>Mantenimiento de flota</h1>
          </div>
        </div>
        <a className="exportButton" href="/api/vehicles/export">
          Descargar Excel
        </a>
      </header>

      <nav className="tabs" aria-label="Modulos">
        <button
          className={activeTab === "FLOTA" ? "activeTab" : ""}
          type="button"
          onClick={() => setActiveTab("FLOTA")}
        >
          Flota
        </button>
        <button
          className={activeTab === "MANTENIMIENTOS" ? "activeTab" : ""}
          type="button"
          onClick={() => setActiveTab("MANTENIMIENTOS")}
        >
          Mantenimientos
        </button>
        <button
          className={activeTab === "DASHBOARD" ? "activeTab" : ""}
          type="button"
          onClick={() => setActiveTab("DASHBOARD")}
        >
          Dashboard
        </button>
      </nav>

      <section className="metricStrip" aria-label="Resumen operativo">
        <div className="metricItem">
          <span>Vehiculos</span>
          <strong>{vehicles.length}</strong>
        </div>
        <div className="metricItem">
          <span>Total de Mantenimientos</span>
          <strong>{maintenanceRecords.length}</strong>
        </div>
        <div className="metricItem">
          <span>En mantenimiento</span>
          <strong>{latestStatusSummary.inMaintenance}</strong>
        </div>
        <div className="metricItem">
          <span>Operativos</span>
          <strong>{latestStatusSummary.operative}</strong>
        </div>
      </section>

      {activeTab === "DASHBOARD" ? (
        <section className="dashboardGrid">
          <section className="dashboardHero">
            <div>
              <p className="eyebrow">Vista gerencial</p>
              <h2>Disponibilidad actual de la flota</h2>
              <p>
                Ultima fecha cargada:{" "}
                <strong>{dashboardStats.latestDate || "Sin datos"}</strong>
              </p>
            </div>
            <div className="availabilityGauge">
              <strong>{dashboardStats.availability}%</strong>
              <span>operatividad</span>
            </div>
          </section>

          <section className="dashboardPanel">
            <div className="panelHeader">
              <h2>Estado actual</h2>
            </div>
            <div className="stackedBar">
              <span
                className="stackedOperative"
                style={{
                  width: `${percent(
                    latestStatusSummary.operative,
                    vehicles.length,
                  )}%`,
                }}
              />
              <span
                className="stackedMaintenance"
                style={{
                  width: `${percent(
                    latestStatusSummary.inMaintenance,
                    vehicles.length,
                  )}%`,
                }}
              />
            </div>
            <div className="legendGrid">
              <span>
                <b className="legendDot operativeDot" /> Operativos:{" "}
                {latestStatusSummary.operative}
              </span>
              <span>
                <b className="legendDot maintenanceDot" /> En mantenimiento:{" "}
                {latestStatusSummary.inMaintenance}
              </span>
            </div>
          </section>

          <section className="dashboardPanel">
            <div className="panelHeader">
              <h2>Flota por CIA</h2>
            </div>
            <div className="barList">
              {dashboardStats.byCia.map(([label, value]) => (
                <div className="barRow" key={label}>
                  <div>
                    <strong>{label}</strong>
                    <span>{value} vehiculo(s)</span>
                  </div>
                  <div className="barTrack">
                    <span
                      style={{ width: `${percent(value, vehicles.length)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboardPanel wideDashboardPanel">
            <div className="panelHeader">
              <h2>Tendencia diaria de estado</h2>
            </div>
            <div className="trendGrid">
              {dashboardStats.trend.map(([date, values]) => {
                const total = values.operativo + values.mantenimiento;
                return (
                  <div className="trendColumn" key={date}>
                    <div className="trendBars">
                      <span
                        className="trendMaintenance"
                        style={{
                          height: `${percent(values.mantenimiento, total)}%`,
                        }}
                      />
                      <span
                        className="trendOperative"
                        style={{
                          height: `${percent(values.operativo, total)}%`,
                        }}
                      />
                    </div>
                    <strong>{date.slice(5)}</strong>
                    <span>{values.mantenimiento} mant.</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="dashboardPanel">
            <div className="panelHeader">
              <h2>Tipo de mantenimiento</h2>
            </div>
            <div className="barList">
              {dashboardStats.byType.length === 0 ? (
                <p>No hay mantenimientos registrados.</p>
              ) : (
                dashboardStats.byType.map(([label, value]) => (
                  <div className="barRow" key={label}>
                    <div>
                      <strong>{label}</strong>
                      <span>{value} registro(s)</span>
                    </div>
                    <div className="barTrack">
                      <span
                        style={{
                          width: `${percent(value, maintenanceRecords.length)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="dashboardPanel">
            <div className="panelHeader">
              <h2>Principales observaciones</h2>
            </div>
            <div className="insightList">
              {dashboardStats.topObservations.length === 0 ? (
                <p>No hay observaciones registradas.</p>
              ) : (
                dashboardStats.topObservations.map(([label, value]) => (
                  <div className="insightItem" key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="dashboardPanel wideDashboardPanel">
            <div className="panelHeader">
              <h2>Unidades actualmente en mantenimiento</h2>
            </div>
            <div className="vehiclePillGrid">
              {dashboardStats.latestMaintenanceVehicles.map((record) => (
                <span className="vehiclePill" key={record.id}>
                  <strong>{record.vehiculo.placa ?? "Sin placa"}</strong>
                  {record.observaciones ||
                    record.rutaUbicacion ||
                    "Sin detalle"}
                </span>
              ))}
            </div>
          </section>
        </section>
      ) : activeTab === "FLOTA" ? (
        <section className="workspace">
          <form className="formPanel" onSubmit={submitFleet}>
            <div className="panelHeader">
              <h2>
                {editingVehicleId ? "Actualizar vehiculo" : "Crear vehiculo"}
              </h2>
              {editingVehicleId && (
                <button
                  className="ghostButton"
                  type="button"
                  onClick={resetFleetForm}
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="formGrid">
              <label>
                Placa
                <input
                  required
                  value={fleetForm.placa}
                  onChange={(event) =>
                    updateFleetField("placa", event.target.value)
                  }
                />
              </label>

              <label>
                Disco
                <input
                  required
                  value={fleetForm.disco}
                  onChange={(event) =>
                    updateFleetField("disco", event.target.value)
                  }
                />
              </label>

              <label>
                Marca
                <input
                  required
                  value={fleetForm.marca}
                  onChange={(event) =>
                    updateFleetField("marca", event.target.value)
                  }
                />
              </label>

              <label>
                Tipo
                <input
                  required
                  value={fleetForm.tipo}
                  onChange={(event) =>
                    updateFleetField("tipo", event.target.value)
                  }
                />
              </label>

              <label>
                Año
                <input
                  required
                  min="1900"
                  max="2100"
                  type="number"
                  value={fleetForm.ano}
                  onChange={(event) =>
                    updateFleetField(
                      "ano",
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                />
              </label>

              <label>
                CIA
                <input
                  required
                  value={fleetForm.cia}
                  onChange={(event) =>
                    updateFleetField("cia", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="formActions">
              <button type="submit" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingVehicleId
                    ? "Actualizar"
                    : "Guardar"}
              </button>

              {message && (
                <p
                  className="statusMessage"
                  style={{
                    color: isErrorMessage(message) ? "#dc2626" : "#047857",
                    fontWeight: "bold",
                  }}
                >
                  {message}
                </p>
              )}
            </div>
          </form>

          <section className="recordsPanel">
            <div className="recordsHeader">
              <div>
                <h2>Flota</h2>
                <p>{filteredVehicles.length} vehiculo(s)</p>
              </div>
              <div className="filters singleFilter">
                <input
                  aria-label="Buscar vehiculo"
                  placeholder="Buscar placa, marca, CIA..."
                  value={fleetSearch}
                  onChange={(event) => setFleetSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Disco</th>
                    <th>Marca</th>
                    <th>Tipo</th>
                    <th>Año</th>
                    <th>CIA</th>
                    <th>Chofer</th>
                    <th>Mantenimientos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8}>Cargando vehiculos...</td>
                    </tr>
                  ) : filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8}>No hay vehiculos para mostrar.</td>
                    </tr>
                  ) : (
                    paginatedVehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td>
                          <strong className="primaryCell">
                            {vehicle.placa ?? ""}
                          </strong>
                        </td>
                        <td>{vehicle.disco ?? ""}</td>
                        <td>{vehicle.marca ?? ""}</td>
                        <td>{vehicle.tipo}</td>
                        <td>{vehicle.ano ?? ""}</td>
                        <td>{vehicle.cia ?? ""}</td>
                        <td>{vehicle.chofer ?? ""}</td>
                        <td>{vehicle._count?.mantenimientos ?? 0}</td>
                        <td>
                          <div className="rowActions">
                            <button
                              type="button"
                              onClick={() => startFleetEdit(vehicle)}
                            >
                              Editar
                            </button>
                            <button
                              className="dangerButton"
                              type="button"
                              onClick={() => deleteVehicle(vehicle)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="paginationBar">
              <span>{getPageRange(fleetPage, filteredVehicles.length)}</span>
              <div className="paginationActions">
                <button
                  className="ghostButton"
                  type="button"
                  disabled={fleetPage <= 1}
                  onClick={() => setFleetPage((page) => page - 1)}
                >
                  Anterior
                </button>
                <strong>
                  Pagina {fleetPage} de {fleetPageCount}
                </strong>
                <button
                  className="ghostButton"
                  type="button"
                  disabled={fleetPage >= fleetPageCount}
                  onClick={() => setFleetPage((page) => page + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>
        </section>
      ) : (
        <section className="workspace">
          <form className="formPanel" onSubmit={submitMaintenance}>
            <div className="panelHeader">
              <h2>
                {editingMaintenanceId
                  ? "Actualizar mantenimiento"
                  : "Crear mantenimiento"}
              </h2>
              {editingMaintenanceId && (
                <button
                  className="ghostButton"
                  type="button"
                  onClick={resetMaintenanceForm}
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="formGrid">
              <label className="wideField">
                Vehiculo
                <select
                  required
                  value={maintenanceForm.vehiculoId}
                  onChange={(event) =>
                    updateMaintenanceField("vehiculoId", event.target.value)
                  }
                >
                  <option value="">Seleccione un vehiculo</option>
                  {vehiclesAvailableForDate.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.placa ?? "Sin placa"} -{" "}
                      {vehicle.marca ?? "Sin marca"} {vehicle.tipo}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Fecha de mantenimiento
                <input
                  required
                  type="date"
                  value={maintenanceForm.fechaMantenimiento}
                  onChange={(event) =>
                    updateMaintenanceField(
                      "fechaMantenimiento",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Estado
                <select
                  value={maintenanceForm.estado}
                  onChange={(event) => {
                    const estado = event.target.value as EstadoVehiculo;

                    setMaintenanceForm((prev) => ({
                      ...prev,
                      estado,
                      tipoMantenimiento:
                        estado === "OPERATIVO"
                          ? "PREVENTIVO"
                          : prev.tipoMantenimiento,
                    }));
                  }}
                >
                  <option value="OPERATIVO">Operativo</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                </select>
              </label>

              <label>
                Kilometraje / Odometro
                <input
                  required
                  min="0"
                  max="9999999"
                  type="number"
                  value={maintenanceForm.kilometrajeOdometro}
                  onChange={(event) =>
                    updateMaintenanceField(
                      "kilometrajeOdometro",
                      Number(event.target.value),
                    )
                  }
                />
              </label>

              {maintenanceForm.estado === "MANTENIMIENTO" && (
                <label>
                  Tipo de mantenimiento
                  <select
                    value={maintenanceForm.tipoMantenimiento}
                    onChange={(event) =>
                      updateMaintenanceField(
                        "tipoMantenimiento",
                        event.target.value as TipoMantenimiento,
                      )
                    }
                  >
                    <option value="CORRECTIVO">Mantenimiento correctivo</option>
                    <option value="PREVENTIVO">Mantenimiento preventivo</option>
                    <option value="PROACTIVO">Mantenimiento proactivo</option>
                  </select>
                </label>
              )}

              <label>
                Ruta / ubicacion
                <input
                  required
                  value={maintenanceForm.rutaUbicacion}
                  onChange={(event) =>
                    updateMaintenanceField("rutaUbicacion", event.target.value)
                  }
                />
              </label>

              <label>
                Tecnicos designados
                <input
                  required
                  value={maintenanceForm.tecnicosDesignados}
                  onChange={(event) =>
                    updateMaintenanceField(
                      "tecnicosDesignados",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="wideField">
                Observaciones
                <textarea
                  rows={3}
                  value={maintenanceForm.observaciones}
                  onChange={(event) =>
                    updateMaintenanceField("observaciones", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="formActions">
              <button type="submit" disabled={saving || vehicles.length === 0}>
                {saving
                  ? "Guardando..."
                  : editingMaintenanceId
                    ? "Actualizar"
                    : "Guardar"}
              </button>

              {message && (
                <p
                  className="statusMessage"
                  style={{
                    color: isErrorMessage(message) ? "#dc2626" : "#047857",
                    fontWeight: "bold",
                  }}
                >
                  {message}
                </p>
              )}
            </div>
          </form>

          <section className="recordsPanel">
            <div className="recordsHeader">
              <div>
                <h2>Mantenimientos</h2>
                <p>{filteredMaintenance.length} registro(s)</p>
              </div>
              <div className="filters">
                <input
                  aria-label="Buscar mantenimiento"
                  placeholder="Buscar placa, fecha, ruta, tecnico..."
                  value={maintenanceSearch}
                  onChange={(event) => setMaintenanceSearch(event.target.value)}
                />
                <input
                  aria-label="Filtrar por fecha"
                  type="date"
                  value={maintenanceDate}
                  onChange={(event) => setMaintenanceDate(event.target.value)}
                />
                <select
                  aria-label="Filtrar estado"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as typeof statusFilter)
                  }
                >
                  <option value="TODOS">Todos</option>
                  <option value="OPERATIVO">Operativo</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                </select>
              </div>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehiculo</th>
                    <th>Disco</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Kilometraje</th>
                    <th>Tipo</th>
                    <th>Ruta</th>
                    <th>Tecnicos</th>
                    <th>Observaciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10}>Cargando mantenimientos...</td>
                    </tr>
                  ) : filteredMaintenance.length === 0 ? (
                    <tr>
                      <td colSpan={10}>No hay mantenimientos para mostrar.</td>
                    </tr>
                  ) : (
                    paginatedMaintenance.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <strong className="primaryCell">
                            {record.vehiculo.placa ?? ""}
                          </strong>
                          <span className="secondaryCell">
                            {record.vehiculo.marca ?? ""}
                          </span>
                        </td>
                        <td>{record.vehiculo.disco ?? ""}</td>
                        <td>{dateForInput(record.fechaMantenimiento)}</td>
                        <td>
                          <span className={`badge ${record.estado}`}>
                            {record.estado === "MANTENIMIENTO"
                              ? "Mantenimiento"
                              : "Operativo"}
                          </span>
                        </td>
                        <td>{record.kilometrajeOdometro}</td>
                        <td>
                          {formatTipoMantenimiento(
                            record.estado,
                            record.tipoMantenimiento,
                          )}
                        </td>
                        <td>{record.rutaUbicacion}</td>
                        <td>{record.tecnicosDesignados}</td>
                        <td>{record.observaciones ?? ""}</td>
                        <td>
                          <div className="rowActions">
                            <button
                              type="button"
                              onClick={() => startMaintenanceEdit(record)}
                            >
                              Editar
                            </button>
                            <button
                              className="dangerButton"
                              type="button"
                              onClick={() => deleteMaintenance(record)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="paginationBar">
              <span>
                {getPageRange(maintenancePage, filteredMaintenance.length)}
              </span>
              <div className="paginationActions">
                <button
                  className="ghostButton"
                  type="button"
                  disabled={maintenancePage <= 1}
                  onClick={() => setMaintenancePage((page) => page - 1)}
                >
                  Anterior
                </button>
                <strong>
                  Pagina {maintenancePage} de {maintenancePageCount}
                </strong>
                <button
                  className="ghostButton"
                  type="button"
                  disabled={maintenancePage >= maintenancePageCount}
                  onClick={() => setMaintenancePage((page) => page + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
