// ============================================================
//  Cloudflare Pages Function — /api/create-preference
//  Crea una preferencia de pago en Mercado Pago (Checkout Pro)
//  desde el servidor, para nunca exponer el Access Token en el
//  frontend. Se despliega solo: al vivir dentro de /functions,
//  Cloudflare Pages la publica automáticamente con cada push.
//
//  Configuración pendiente (una sola vez, en el dashboard):
//  Cloudflare Pages → tu proyecto → Settings → Environment variables
//    MP_ACCESS_TOKEN = tu Access Token privado de Mercado Pago
//
//  Mientras esa variable no exista, este endpoint responde 501 y
//  el frontend (cart.js → startCheckout) cae automáticamente al
//  checkout por WhatsApp, así el sitio nunca se rompe.
// ============================================================

function getDiscount(qty) {
  // Debe reflejar exactamente la misma regla que cart.js (getDiscount)
  if (qty >= 3) return 0.15;
  if (qty >= 2) return 0.10;
  return 0;
}

function formatItemLabel(brand, name) {
  // Debe reflejar exactamente la misma regla que cart.js (formatItemLabel)
  return name.toLowerCase().startsWith(brand.toLowerCase()) ? name : `${brand} ${name}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.MP_ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Mercado Pago todavía no está configurado (falta MP_ACCESS_TOKEN)." }),
      { status: 501, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return new Response(JSON.stringify({ error: "El carrito está vacío" }), { status: 400 });
  }

  const totalQty = items.reduce((sum, i) => sum + Number(i.qty || 1), 0);
  const discount = getDiscount(totalQty);
  const origin = new URL(request.url).origin;

  const preference = {
    items: items.map(i => ({
      title: `${formatItemLabel(i.brand, i.name)} — talle ${i.size}${i.purchaseType === "preorder" ? " (por encargue)" : ""}`,
      quantity: Number(i.qty || 1),
      currency_id: "UYU",
      unit_price: Math.round(Number(i.price) * (1 - discount) * 100) / 100
    })),
    // Sin extensión .html a propósito: algunos hosts (incluido Cloudflare
    // Pages con clean URLs) redirigen /archivo.html → /archivo y ese
    // salto puede perder el query string. Pidiendo la ruta limpia
    // directamente evitamos ese redirect y el status siempre llega.
    back_urls: {
      success: `${origin}/pago-retorno?status=approved`,
      pending: `${origin}/pago-retorno?status=pending`,
      failure: `${origin}/pago-retorno?status=failure`
    },
    auto_return: "approved",
    notification_url: `${origin}/api/mp-webhook`
  };

  try {
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    if (!mpRes.ok) {
      const detail = await mpRes.text();
      return new Response(
        JSON.stringify({ error: "Mercado Pago rechazó la preferencia", detail }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await mpRes.json();
    return new Response(
      JSON.stringify({ init_point: data.init_point }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "No se pudo conectar con Mercado Pago" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
