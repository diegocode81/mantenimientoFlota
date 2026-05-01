# Mantenimiento de Flota

Sistema sencillo para registrar mantenimientos de vehiculos con Next.js,
Prisma y PostgreSQL.

## Funciones

- Pestana Flota para crear, consultar, editar y eliminar vehiculos con placa,
  disco, marca, tipo, ano y CIA.
- Pestana Mantenimientos para seleccionar un vehiculo y registrar fecha, estado,
  kilometraje/odometro, tipo de mantenimiento, ruta/ubicacion, tecnicos
  designados y observaciones.
- Editar y eliminar vehiculos o mantenimientos por separado.
- Buscar por placa, marca, ruta, tecnicos y otros campos principales.
- Filtrar por estado operativo o mantenimiento.
- Descargar un archivo Excel compatible (`.xls`) con el historial de
  mantenimientos y los datos del vehiculo.

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env` desde el ejemplo:

```bash
cp .env.example .env
```

3. Coloca tus cadenas PostgreSQL en `DATABASE_URL` y `DIRECT_URL`.

4. Ejecuta la migracion:

```bash
npm run prisma:migrate
```

5. Inicia el proyecto:

```bash
npm run dev
```

La app queda disponible normalmente en `http://localhost:3000`.

## Despliegue en Vercel

1. Sube este repositorio a GitHub.
2. Crea el proyecto en Vercel importando el repositorio.
3. Crea o conecta una base PostgreSQL y copia su connection string.
4. Agrega en Vercel las variables de entorno `DATABASE_URL` y `DIRECT_URL`.
5. Usa estos comandos:

```text
Build Command: npm run build
Install Command: npm install
```

6. Ejecuta la migracion en produccion una vez:

```bash
npx prisma migrate deploy
```

Si usas la CLI de Vercel, puedes ejecutar la migracion con las variables del
proyecto ya cargadas:

```bash
vercel env pull .env
npx prisma migrate deploy
```
