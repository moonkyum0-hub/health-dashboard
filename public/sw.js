const CACHE = "mhd-v1";
const OFFLINE_URL = "/offline";

// 설치 시 핵심 페이지 캐시
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["/", OFFLINE_URL]))
  );
  self.skipWaiting();
});

// 이전 캐시 정리
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 네트워크 우선 전략 (API, 동적 페이지)
// 실패 시 캐시 폴백
self.addEventListener("fetch", (e) => {
  // POST / non-GET 요청은 서비스워커 우회
  if (e.request.method !== "GET") return;
  // Next.js 내부 요청 우회
  if (e.request.url.includes("/_next/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 성공 응답은 캐시에 저장
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((cached) => cached ?? caches.match(OFFLINE_URL)))
  );
});
