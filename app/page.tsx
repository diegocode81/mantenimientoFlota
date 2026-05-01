"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EstadoVehiculo = "OPERATIVO" | "MANTENIMIENTO";

type Vehicle = {
  id: string;
  placa: string;
  disco: string;
  marca: string;
  tipo: string;
  ano: number;
  cia: string;
  fechaMantenimiento: string;
  estado: EstadoVehiculo;
  observaciones: string | null;
  rutaUbicacion: string;
  tecnicosDesignados: string;
};

type VehicleForm = Omit<Vehicle, "id" | "fechaMantenimiento"> & {
  fechaMantenimiento: string;
};

const emptyForm: VehicleForm = {
  placa: "",
  disco: "",
  marca: "",
  tipo: "",
  ano: new Date().getFullYear(),
  cia: "",
  fechaMantenimiento: new Date().toISOString().slice(0, 10),
  estado: "OPERATIVO",
  observaciones: "",
  rutaUbicacion: "",
  tecnicosDesignados: "",
};

function dateForInput(value: string) {
  return value.slice(0, 10);
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | EstadoVehiculo>(
    "TODOS",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadVehicles() {
    setLoading(true);
    const response = await fetch("/api/vehicles");
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "No se pudieron cargar los registros.");
      return;
    }

    setVehicles(data);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesStatus =
        statusFilter === "TODOS" || vehicle.estado === statusFilter;
      const matchesSearch =
        !term ||
        [
          vehicle.placa,
          vehicle.disco,
          vehicle.marca,
          vehicle.tipo,
          vehicle.cia,
          vehicle.rutaUbicacion,
          vehicle.tecnicosDesignados,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [vehicles, search, statusFilter]);

  function updateField<K extends keyof VehicleForm>(
    field: K,
    value: VehicleForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch(
      editingId ? `/api/vehicles/${editingId}` : "/api/vehicles",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo guardar el registro.");
      return;
    }

    resetForm();
    setMessage(editingId ? "Registro actualizado." : "Registro creado.");
    await loadVehicles();
  }

  function startEdit(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setForm({
      placa: vehicle.placa,
      disco: vehicle.disco,
      marca: vehicle.marca,
      tipo: vehicle.tipo,
      ano: vehicle.ano,
      cia: vehicle.cia,
      fechaMantenimiento: dateForInput(vehicle.fechaMantenimiento),
      estado: vehicle.estado,
      observaciones: vehicle.observaciones ?? "",
      rutaUbicacion: vehicle.rutaUbicacion,
      tecnicosDesignados: vehicle.tecnicosDesignados,
    });
    setMessage("Editando registro seleccionado.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteVehicle(vehicle: Vehicle) {
    const confirmed = window.confirm(
      `Eliminar el registro de la placa ${vehicle.placa}?`,
    );
    if (!confirmed) return;

    const response = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo eliminar el registro.");
      return;
    }

    setMessage("Registro eliminado.");
    await loadVehicles();
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

      <section className="workspace">
        <form className="formPanel" onSubmit={handleSubmit}>
          <div className="panelHeader">
            <h2>{editingId ? "Actualizar registro" : "Nuevo registro"}</h2>
            {editingId && (
              <button className="ghostButton" type="button" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>

          <div className="formGrid">
            <label>
              Placa
              <input
                required
                value={form.placa}
                onChange={(event) => updateField("placa", event.target.value)}
              />
            </label>
            <label>
              Disco
              <input
                required
                value={form.disco}
                onChange={(event) => updateField("disco", event.target.value)}
              />
            </label>
            <label>
              Marca
              <input
                required
                value={form.marca}
                onChange={(event) => updateField("marca", event.target.value)}
              />
            </label>
            <label>
              Tipo
              <input
                required
                value={form.tipo}
                onChange={(event) => updateField("tipo", event.target.value)}
              />
            </label>
            <label>
              Ano
              <input
                required
                min="1900"
                max="2100"
                type="number"
                value={form.ano}
                onChange={(event) =>
                  updateField("ano", Number(event.target.value))
                }
              />
            </label>
            <label>
              CIA
              <input
                required
                value={form.cia}
                onChange={(event) => updateField("cia", event.target.value)}
              />
            </label>
            <label>
              Fecha de mantenimiento
              <input
                required
                type="date"
                value={form.fechaMantenimiento}
                onChange={(event) =>
                  updateField("fechaMantenimiento", event.target.value)
                }
              />
            </label>
            <label>
              Estado
              <select
                value={form.estado}
                onChange={(event) =>
                  updateField("estado", event.target.value as EstadoVehiculo)
                }
              >
                <option value="OPERATIVO">Operativo</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
            </label>
            <label>
              Ruta / ubicacion
              <input
                required
                value={form.rutaUbicacion}
                onChange={(event) =>
                  updateField("rutaUbicacion", event.target.value)
                }
              />
            </label>
            <label>
              Tecnicos designados
              <input
                required
                value={form.tecnicosDesignados}
                onChange={(event) =>
                  updateField("tecnicosDesignados", event.target.value)
                }
              />
            </label>
            <label className="wideField">
              Observaciones
              <textarea
                rows={3}
                value={form.observaciones ?? ""}
                onChange={(event) =>
                  updateField("observaciones", event.target.value)
                }
              />
            </label>
          </div>

          <div className="formActions">
            <button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
            </button>
            {message && <p className="statusMessage">{message}</p>}
          </div>
        </form>

        <section className="recordsPanel">
          <div className="recordsHeader">
            <div>
              <h2>Registros</h2>
              <p>{filteredVehicles.length} resultado(s)</p>
            </div>
            <div className="filters">
              <input
                aria-label="Buscar"
                placeholder="Buscar placa, marca, ruta..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
                  <th>Placa</th>
                  <th>Disco</th>
                  <th>Marca</th>
                  <th>Tipo</th>
                  <th>Ano</th>
                  <th>CIA</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Ruta</th>
                  <th>Tecnicos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11}>Cargando registros...</td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={11}>No hay registros para mostrar.</td>
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
                      <td>{dateForInput(vehicle.fechaMantenimiento)}</td>
                      <td>
                        <span className={`badge ${vehicle.estado}`}>
                          {vehicle.estado === "MANTENIMIENTO"
                            ? "Mantenimiento"
                            : "Operativo"}
                        </span>
                      </td>
                      <td>{vehicle.rutaUbicacion}</td>
                      <td>{vehicle.tecnicosDesignados}</td>
                      <td>
                        <div className="rowActions">
                          <button type="button" onClick={() => startEdit(vehicle)}>
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
    </main>
  );
}
