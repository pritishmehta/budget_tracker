const CACHE_NAME = 'budget-tracker-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Cache failed:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, return offline page
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncTransactions());
  }
});

// Sync transactions when back online
async function syncTransactions() {
  try {
    // Get pending transactions from IndexedDB
    const db = await openDB();
    const transaction = db.transaction(['pending_transactions'], 'readonly');
    const store = transaction.objectStore('pending_transactions');
    const pendingTransactions = await store.getAll();
    
    // Sync each pending transaction
    for (const transaction of pendingTransactions) {
      // In a real app, you'd sync with your server here
      console.log('Syncing transaction:', transaction);
      
      // Remove from pending after successful sync
      const deleteTransaction = db.transaction(['pending_transactions'], 'readwrite');
      const deleteStore = deleteTransaction.objectStore('pending_transactions');
      await deleteStore.delete(transaction.id);
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BudgetTrackerPro', 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}