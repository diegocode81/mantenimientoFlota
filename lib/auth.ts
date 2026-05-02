import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RolUsuario } from "@prisma/client";

export const SESSION_COOKIE = "fleet_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

export type SessionUser = {
  id: string;
  usuario: string;
  rol: RolUsuario;
};

type SessionPayload = SessionUser & {
  exp: number;
};

function getSecret() {
  return (
    process.env.AUTH_SECRET ??
    process.env.DATABASE_URL ??
    "mantenimiento-flota-dev-secret"
  );
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function encodeSession(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token: string): SessionUser | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body), "hex");
  const actual = Buffer.from(signature, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (!payload.id || !payload.usuario || !payload.rol) return null;
    if (payload.exp < Date.now()) return null;
    if (
      payload.rol !== RolUsuario.ADMINISTRADOR &&
      payload.rol !== RolUsuario.ANALISTA
    ) {
      return null;
    }

    return {
      id: payload.id,
      usuario: payload.usuario,
      rol: payload.rol,
    };
  } catch {
    return null;
  }
}

export function normalizeUser(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("El usuario es obligatorio.");
  }

  return value.trim().toLowerCase();
}

export function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`El campo ${field} es obligatorio.`);
  }

  return value.trim();
}

export function normalizeEmail(value: unknown) {
  const email = requireText(value, "correo").toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!validEmail) {
    throw new Error("El correo no es valido.");
  }

  return email;
}

export function parsePassword(value: unknown) {
  if (typeof value !== "string" || value.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  return value;
}

export function parseOptionalPassword(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parsePassword(value);
}

export function parseRole(value: unknown) {
  if (value !== RolUsuario.ADMINISTRADOR && value !== RolUsuario.ANALISTA) {
    throw new Error("El perfil no es valido.");
  }

  return value;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? decodeSession(token) : null;
}

export async function requireSession() {
  return getSession();
}

export async function requireAdmin() {
  const session = await getSession();
  return session?.rol === RolUsuario.ADMINISTRADOR ? session : null;
}

export function setSessionCookie(response: NextResponse, user: SessionUser) {
  response.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "No autenticado." }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "No autorizado." }, { status: 403 });
}
