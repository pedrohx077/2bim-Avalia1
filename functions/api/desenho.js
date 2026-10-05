import { gerarDesenho } from "../../lib/desenho.js";

const erro = (msg, status, extra = {}) =>
  new Response(JSON.stringify({ erro: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

export async function onRequest({ request, env }) {
  // 1) Método -> 405
  if (request.method !== "POST") {
    return erro("Metodo nao permitido", 405, { Allow: "POST" });
  }

  // 2) Corpo -> 400
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return erro("Corpo ausente ou JSON invalido", 400);
  }
  const n = corpo && corpo.numero;
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    return erro("numero deve ser um inteiro entre 1 e 100", 400);
  }

  // 3) Token -> 401
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return erro("Token ausente", 401);

  let info;
  try {
    const r = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        encodeURIComponent(m[1].trim())
    );
    if (r.status !== 200) return erro("Token invalido ou expirado", 401);
    info = await r.json();
  } catch {
    return erro("Falha ao verificar o token", 401);
  }

  if (!env.GOOGLE_CLIENT_ID || info.aud !== env.GOOGLE_CLIENT_ID) {
    return erro("Token emitido para outro cliente", 401);
  }
  if (String(info.email_verified) !== "true" || !info.email) {
    return erro("E-mail nao verificado", 401);
  }

  // 200
  return new Response(gerarDesenho(n, info.email), {
    status: 200,
    headers: { "Content-Type": "image/svg+xml" },
  });
}
