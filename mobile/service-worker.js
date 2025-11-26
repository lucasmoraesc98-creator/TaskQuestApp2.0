// mobile/pwa-config/service-worker.js
const CACHE_NAME = 'taskquest-v1.0.0';
const API_CACHE_NAME = 'taskquest-api-v1.0.0';

// Assets para cache imediato
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Estratégia: Cache First para assets, Network First para APIs
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache de assets aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network First com fallback para cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache da resposta da API
          const responseClone = response.clone();
          caches.open(API_CACHE_NAME)
            .then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback para dados offline
              return offlineFallback(request);
            });
        })
    );
    return;
  }

  // Assets - Cache First
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            // Não cacheamos tudo, apenas recursos importantes
            if (request.url.includes('/static/')) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Sincronização em background iniciada');
    event.waitUntil(syncOfflineData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '../app-icons/icon-192x192.png',
    badge: '../app-icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Funções auxiliares
async function syncOfflineData() {
  const offlineQueue = await getOfflineQueue();
  console.log(`🔄 Sincronizando ${offlineQueue.length} itens offline`);

  for (const item of offlineQueue) {
    try {
      await syncItem(item);
      await removeFromOfflineQueue(item.id);
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    }
  }
}

async function getOfflineQueue() {
  // Implementar com IndexedDB
  return [];
}

async function syncItem(item) {
  // Implementar sincronização com backend
}

async function removeFromOfflineQueue(id) {
  // Implementar remoção da fila
}

function offlineFallback(request) {
  const url = new URL(request.url);
  
  // Fallbacks específicos para diferentes endpoints
  if (url.pathname === '/api/tasks') {
    return new Response(JSON.stringify({
      message: 'Modo offline ativo',
      tasks: getCachedTasks()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Offline - Tente novamente quando estiver conectado', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

function getCachedTasks() {
  // Retorna tarefas em cache para modo offline
  return [];
}