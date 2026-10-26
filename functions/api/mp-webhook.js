// ============================================================
//  Cloudflare Pages Function — /api/mp-webhook
//  Receptor de notificaciones (IPN/webhook) de Mercado Pago.
//
//  Esta es la forma robusta de confirmar un Purchase (mejor que
//  confiar solo en el redirect del navegador, que el cliente
//  podría cerrar antes de volver). Por ahora deja registrado el
//  evento recibido; para marcar la orden como pagada de verdad
//  hace falta:
//   1) Guardar el estado en algo persistente (Cloudflare KV o D1).
//   2) Si instalás Meta Pixel, disparar Purchase server-side acá
//      mismo con la Conversions API de Meta (más confiable que el
//      evento de navegador de pago-retorno.html).
//
//  No hace falta tocarlo para que el checkout funcione: el flujo
//  de pago-retorno.html ya confirma la compra al cliente.
// ============================================================

export async function onRequestPost(context) {
  const { request } = context;
  try {
    const payload = await request.json();
    console.log("MP webhook recibido:", JSON.stringify(payload));
  } catch (err) {
    // Mercado Pago a veces notifica por query string en vez de body JSON.
  }
  return new Response("ok", { status: 200 });
}

export async function onRequestGet() {
  return new Response("ok", { status: 200 });
}
