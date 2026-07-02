const CACHE_STATIC = "mhd-static-v1";
const CACHE_DYNAMIC = "mhd-dynamic-v1";
const OFFLINE_URL = "/offline";

// 설치 시 핵심 페이지 프리캐시
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_DYNAMIC).then((c) => c.addAll(["/", OFFLINE_URL]))
  );
  self.skipWaiting();
});

// 이전 캐시 정리
self.addEventListener("activate", (e) => {
  const keep = [CACHE_STATIC, CACHE_DYNAMIC];
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = e.request.url;

  // /_next/static/ — 해시 파일명으로 내용 불변 → cache-first
  if (url.includes("/_next/static/")) {
    e.respondWith(
      caches.open(CACHE_STATIC).then((c) =>
        c.match(e.request).then((cached) => {
          if (cached) return cached;
          return fetch(e.request).then((res) => {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // 그 외 /_next/ 내부 요청 (HMR 등) — 우회
  if (url.includes("/_next/")) return;

  // 일반 페이지 / API — network-first, 실패 시 캐시 → /offline
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_DYNAMIC).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => cached ?? caches.match(OFFLINE_URL))
      )
  );
});
