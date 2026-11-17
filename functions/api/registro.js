// ============================================================
//  Cloudflare Pages Function — /api/registro
//  Registro de clientes en la web → cupón de $300 para la
//  primera compra. Genera un código único y lo guarda en la
//  planilla "BuenAndar - Inventario v2" (pestaña Registros)
//  a través del webhook de Make.
//
//  Variable opcional en Cloudflare Pages (Settings → Environment
//  variables): MAKE_HOOK_URL. Si no existe, usa el webhook actual.
// ============================================================

const DEFAULT_HOOK = "https://hook.us2.make.com/s1obogrk1eftkroym3nt101dwdwcvkyq";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para que no se confundan

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function makeCode() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return "BA300-" + Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join("");
}

function clean(value, max) {
  return String(value || "").replace(/[\u0000-\u001f"\\<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function todayUY() {
  return new Date().toLocaleString("es-UY", {
    timeZone: "America/Montevideo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Datos inválidos" }, 400);
  }

  // Honeypot anti-bots: campo oculto que una persona nunca completa
  if (body.website) return json({ ok: true, cupon: makeCode() });

  const nombre = clean(body.nombre, 80);
  const email = clean(body.email, 120).toLowerCase();
  const celular = clean(body.celular, 20).replace(/[^\d+]/g, "");
  const origen = clean(body.origen, 40) || "web";

  if (nombre.split(" ").filter(Boolean).length < 2) {
    return json({ ok: false, error: "Poné tu nombre y apellido" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Revisá tu email" }, 400);
  }
  if (!/^(\+?598)?0?9\d{7}$/.test(celular)) {
    return json({ ok: false, error: "Revisá tu celular (ej: 099 123 456)" }, 400);
  }

  const cupon = makeCode();
  const payload = {
    accion: "registro",
    fecha: todayUY(),
    nombre,
    email,
    // El apóstrofo hace que la planilla lo guarde como texto (mantiene el 0)
    celular: "'" + celular,
    cupon,
    origen
  };

  try {
    const res = await fetch(env.MAKE_HOOK_URL || DEFAULT_HOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("hook " + res.status);
  } catch (err) {
    return json({ ok: false, error: "No pudimos registrarte ahora. Probá de nuevo en un minuto." }, 502);
  }

  return json({ ok: true, cupon });
}
