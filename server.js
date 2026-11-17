const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// ---------------------------------------------------------------------------
// Arreglo de cuelgues tras inactividad al hablar con el backend C# (IP pública
// 200.56.97.5, detrás de un NAT que corta las conexiones TCP idle a los ~2 min).
// Se hace AQUÍ (en server.js, Node puro) y NO en instrumentation.ts porque el
// cargador de instrumentation hooks de Next 16 usa `util.markAsUncloneable`, que
// solo existe en Node 22+, y el servidor corre Node 20.10 -> truena con 500.
// Detalle técnico: el `fetch` de Node (undici) conserva conexiones keep-alive
// hasta 10 min y reutiliza un socket ya muerto por el NAT -> la petición se cuelga.
// Aquí envolvemos `globalThis.fetch` y, SOLO para URLs del backend, usamos el
// `fetch` del paquete undici con un Agent que cierra las conexiones idle a los 10s.
// ---------------------------------------------------------------------------
try {
  // Cargar variables de .env (server.js corre antes que Next, así que .env aún no está cargado).
  require('@next/env').loadEnvConfig(process.cwd())
} catch (e) {
  // si @next/env no está, seguimos: usaremos process.env del sistema si existe
}
const backend = process.env.URL_API_CEA || ''
if (backend) {
  const { fetch: undiciFetch, Agent } = require('undici')
  const agent = new Agent({
    keepAliveTimeout: 10000,    // cierra conexiones idle a los 10s (NAT corta a ~2min)
    keepAliveMaxTimeout: 10000, // tope duro, ignora el Keep-Alive del backend
    connect: { timeout: 10000 } // si la conexión está muerta, falla en 10s, no en ~60s
  })
  const originalFetch = globalThis.fetch
  globalThis.fetch = (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input && input.url) || ''
    if (url && url.startsWith(backend)) {
      return undiciFetch(input, { ...init, dispatcher: agent })
    }
    return originalFetch(input, init)
  }
  console.log('[server.js] keep-alive del backend ajustado:', backend)
}

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3004;
const app = next({ dev })
const handle = app.getRequestHandler()
app.prepare().then(() => {
createServer((req, res) => {
// Be sure to pass `true` as the second argument to `url.parse`.
// This tells it to parse the query portion of the URL.
const parsedUrl = parse(req.url, true)
//console.log('parsedUrl', parsedUrl);
const { pathname, query } = parsedUrl
if (pathname === '/a') {
app.render(req, res, '/a', query)
} else if (pathname === '/b') {
app.render(req, res, '/b', query)
} else {
handle(req, res, parsedUrl)
}
}).listen(port, (err) => {
if (err) throw err
//console.log(`> Ready on http://localhost:${port}`)
})
})
