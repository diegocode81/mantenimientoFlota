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
  const vehicles = await prisma.vehiculoMantenimiento.findMany({
    orderBy: [{ fechaMantenimiento: "desc" }, { createdAt: "desc" }],
  });

  const headers = [
    "Placa",
    "Disco",
    "Marca",
    "Tipo",
    "Ano",
    "CIA",
    "Fecha de mantenimiento",
    "Estado",
    "Observaciones",
    "Ruta / Ubicacion",
    "Tecnicos designados",
  ];

  const rows = vehicles
    .map((vehicle) => {
      const values = [
        vehicle.placa,
        vehicle.disco,
        vehicle.marca,
        vehicle.tipo,
        vehicle.ano,
        vehicle.cia,
        vehicle.fechaMantenimiento.toISOString().slice(0, 10),
        vehicle.estado === "MANTENIMIENTO" ? "Mantenimiento" : "Operativo",
        vehicle.observaciones ?? "",
        vehicle.rutaUbicacion,
        vehicle.tecnicosDesignados,
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
