import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function escapeXml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cell(value: string | number) {
  const type = typeof value === "number" ? "Number" : "String";
  return `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

export async function GET() {
  const records = await prisma.mantenimientoVehiculo.findMany({
    orderBy: [{ fechaMantenimiento: "desc" }, { createdAt: "desc" }],
    include: { vehiculo: true },
  });

  const headers = [
    "Placa",
    "Disco",
    "Marca",
    "Tipo",
    "Año",
    "CIA",
    "Fecha de mantenimiento",
    "Estado",
    "Kilometraje / Odometro",
    "Tipo de mantenimiento",
    "Observaciones",
    "Ruta / Ubicacion",
    "Tecnicos designados",
  ];

  const rows = records
    .map((record) => {
      const values = [
        record.vehiculo.placa ?? "",
        record.vehiculo.disco ?? "",
        record.vehiculo.marca ?? "",
        record.vehiculo.tipo,
        record.vehiculo.ano ?? "",
        record.vehiculo.cia ?? "",
        record.fechaMantenimiento.toISOString().slice(0, 10),
        record.estado === "MANTENIMIENTO" ? "Mantenimiento" : "Operativo",
        record.kilometrajeOdometro,
        record.tipoMantenimiento === "CORRECTIVO"
          ? "Mantenimiento correctivo"
          : record.tipoMantenimiento === "PREVENTIVO"
            ? "Mantenimiento preventivo"
            : "Mantenimiento proactivo",
        record.observaciones ?? "",
        record.rutaUbicacion,
        record.tecnicosDesignados,
      ];

      return `<Row>${values.map(cell).join("")}</Row>`;
    })
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#EFF4F7" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Mantenimientos">
    <Table>
      <Row ss:StyleID="header">${headers.map(cell).join("")}</Row>
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="mantenimientos-vehiculos.xls"',
    },
  });
}
