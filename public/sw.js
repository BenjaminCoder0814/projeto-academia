/* Service worker simples: casca em cache para abrir offline. */
const CACHE = 'projetinho-v1'
const CASCA = ['/', '/index.html', '/manifest.webmanifest', '/icone-192.png', '/icone-512.png']

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // nada de cachear chamadas de dados nem fotos assinadas
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/storage/')) return

  if (req.mode === 'navigate') {
    evento.respondWith(fetch(req).catch(() => caches.match('/index.html')))
    return
  }

  evento.respondWith(
    caches.match(req).then(
      (emCache) =>
        emCache ||
        fetch(req).then((resposta) => {
          const copia = resposta.clone()
          if (resposta.ok) caches.open(CACHE).then((c) => c.put(req, copia))
          return resposta
        }),
    ),
  )
})
