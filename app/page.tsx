"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EstadoVehiculo = "OPERATIVO" | "MANTENIMIENTO";
type TipoMantenimiento = "CORRECTIVO" | "PREVENTIVO" | "PROACTIVO";
type Tab = "FLOTA" | "MANTENIMIENTOS";

type FleetVehicle = {
  id: string;
  placa: string;
  disco: string;
  marca: string;
  tipo: string;
  ano: number;
  cia: string;
  _count?: { mantenimientos: number };
};

type MaintenanceRecord = {
  id: string;
  vehiculoId: string;
  fechaMantenimiento: string;
  estado: EstadoVehiculo;
  kilometrajeOdometro: number;
  tipoMantenimiento: TipoMantenimiento;
  rutaUbicacion: string;
  tecnicosDesignados: string;
  observaciones: string | null;
  vehiculo: FleetVehicle;
};

type FleetForm = Omit<FleetVehicle, "id" | "_count">;

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

function dateForInput(value: string) {
  return value.slice(0, 10);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("FLOTA");
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([]);
  const [fleetForm, setFleetForm] = useState<FleetForm>(emptyFleetForm);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceForm>(
    emptyMaintenanceForm,
  );
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<
    string | null
  >(null);
  const [fleetSearch, setFleetSearch] = useState("");
  const [maintenanceSearch, setMaintenanceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | EstadoVehiculo>(
    "TODOS",
  );
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
      [
        vehicle.placa,
        vehicle.disco,
        vehicle.marca,
        vehicle.tipo,
        vehicle.cia,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [vehicles, fleetSearch]);

  const filteredMaintenance = useMemo(() => {
    const term = maintenanceSearch.trim().toLowerCase();

    return maintenanceRecords.filter((record) => {
      const matchesStatus =
        statusFilter === "TODOS" || record.estado === statusFilter;
      const matchesSearch =
        !term ||
        [
          record.vehiculo.placa,
          record.vehiculo.disco,
          record.vehiculo.marca,
          String(record.kilometrajeOdometro),
          record.tipoMantenimiento,
          record.rutaUbicacion,
          record.tecnicosDesignados,
          record.observaciones ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [maintenanceRecords, maintenanceSearch, statusFilter]);

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

    const response = await fetch(
      editingMaintenanceId
        ? `/api/maintenance/${editingMaintenanceId}`
        : "/api/maintenance",
      {
        method: editingMaintenanceId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maintenanceForm),
      },
    );
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo guardar el mantenimiento.");
      return;
    }

    resetMaintenanceForm();
    setMessage(
      editingMaintenanceId
        ? "Mantenimiento actualizado."
        : "Mantenimiento creado.",
    );
    await loadData();
  }

  function startFleetEdit(vehicle: FleetVehicle) {
    setEditingVehicleId(vehicle.id);
    setFleetForm({
      placa: vehicle.placa,
      disco: vehicle.disco,
      marca: vehicle.marca,
      tipo: vehicle.tipo,
      ano: vehicle.ano,
      cia: vehicle.cia,
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
      tipoMantenimiento: record.tipoMantenimiento,
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
      `Eliminar el vehiculo ${vehicle.placa}? Tambien se eliminaran sus mantenimientos.`,
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
      `Eliminar el mantenimiento de ${record.vehiculo.placa}?`,
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
        <div>
          <p className="eyebrow">Control operativo</p>
          <h1>Mantenimiento de flota</h1>
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
      </nav>

      {activeTab === "FLOTA" ? (
        <section className="workspace">
          <form className="formPanel" onSubmit={submitFleet}>
            <div className="panelHeader">
              <h2>{editingVehicleId ? "Actualizar vehiculo" : "Crear vehiculo"}</h2>
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
                Ano
                <input
                  required
                  min="1900"
                  max="2100"
                  type="number"
                  value={fleetForm.ano}
                  onChange={(event) =>
                    updateFleetField("ano", Number(event.target.value))
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
              {message && <p className="statusMessage">{message}</p>}
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
                    <th>Ano</th>
                    <th>CIA</th>
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
                    filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td>{vehicle.placa}</td>
                        <td>{vehicle.disco}</td>
                        <td>{vehicle.marca}</td>
                        <td>{vehicle.tipo}</td>
                        <td>{vehicle.ano}</td>
                        <td>{vehicle.cia}</td>
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
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.placa} - {vehicle.marca} {vehicle.tipo}
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
                  onChange={(event) =>
                    updateMaintenanceField(
                      "estado",
                      event.target.value as EstadoVehiculo,
                    )
                  }
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
              {message && <p className="statusMessage">{message}</p>}
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
                  placeholder="Buscar placa, ruta, tecnico..."
                  value={maintenanceSearch}
                  onChange={(event) => setMaintenanceSearch(event.target.value)}
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
                    filteredMaintenance.map((record) => (
                      <tr key={record.id}>
                        <td>
                          {record.vehiculo.placa} - {record.vehiculo.marca}
                        </td>
                        <td>{record.vehiculo.disco}</td>
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
                          {record.tipoMantenimiento === "CORRECTIVO"
                            ? "Correctivo"
                            : record.tipoMantenimiento === "PREVENTIVO"
                              ? "Preventivo"
                              : "Proactivo"}
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
          </section>
        </section>
      )}
    </main>
  );
}
