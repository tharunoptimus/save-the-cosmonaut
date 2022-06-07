const CACHE = "v2.0" // name of the current cache
const OFFLINE = "/offline"
const CDNS = "Third-Party"

const AUTO_CACHE = [
	OFFLINE,
	"/",
    "/css/home.css",
    "/css/main.css",
    
    "/js/home.js",
    "/js/main.js",

    "/media/asteroid.png",
    "/media/astro.png",
    "/media/cosmonaut.png",
    "/media/satellite.png",
    "/media/starfield.jpg",

    "/apple-touch-icon.png",
    "/logo512.png",
    "/favicon.ico",
	"/site.webmanifest",

    "/game"

]

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(AUTO_CACHE))
			.then(self.skipWaiting())
	)
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return cacheNames.filter((cacheName) => CACHE !== cacheName)
			})
			.then((unusedCaches) => {
				console.log("DESTROYING CACHE", unusedCaches.join(","))
				return Promise.all(
					unusedCaches.map((unusedCache) => {
						return caches.delete(unusedCache)
					})
				)
			})
			.then(() => self.clients.claim())
	)
})

function isCached(url) {
	let origin = self.location.origin
	if (url.includes("assets")) return true
	if (url == `${origin}/`) return true
	if (url.includes("logo512.png") || url.includes("favicon.ico") || url.includes("site.webmanifest")) return true
	return false
}

self.addEventListener("fetch", (event) => {

	if (
		!event.request.url.startsWith(self.location.origin) ||
		event.request.method !== "GET"
	) {
		return void event.respondWith(fetch(event.request).catch((err) => console.log(err)))
	}

	if (event.request.url.includes("cdnjs.cloudflare.com")
		|| event.request.url.includes("maxcdn.bootstrapcdn.com")
		|| event.request.url.includes("code.jquery.com")
		|| event.request.url.includes("cdn.jsdelivr.net")
		|| event.request.url.includes("fonts.googleapis.com")
		|| event.request.url.includes("fonts.gstatic.com")
		|| event.request.url.includes("use.fontawesome.com")
		) {
        event.respondWith(
            caches.open(CDNS).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) return response
                    return fetch(event.request).then((response) => {
                        cache.put(event.request, response.clone())
                        return response
                    })
                })
            })
        )
        return
    }

	if(!isCached(event.request.url)){
		event.respondWith(
			
			fetch(event.request)
			.then((response) => {
				caches.open(CACHE).then((cache) => {
					cache.put(event.request, response)
				})
				return response.clone()
			})
			.catch((_err) => {
				return caches.match(event.request).then((cachedResponse) => {
					if (cachedResponse) {
						return cachedResponse
					}

					return caches.open(CACHE).then((cache) => {
						const offlineRequest = new Request(OFFLINE)
						return cache.match(offlineRequest)
					})
				})
			})
			
		)
	} else {
		event.respondWith(
			caches.match(event.request).then((response) => {
				if (response) {
					return response
				}

				return fetch(event.request).then((response) => {
					caches.open(CACHE).then((cache) => {
						cache.put(event.request, response)
					})
					return response.clone()
				})
			})
		)
	}

})
