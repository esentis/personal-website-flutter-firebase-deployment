'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "9e7af88eb972fdfa3c1c6ed3ba88ed2f",
"assets/assets/ai.png": "76ca04f90e54ab96294a990d918bf44c",
"assets/assets/android.png": "bcb24ade0efb86e985b4465438888446",
"assets/assets/css3.png": "1711d067c8f3b37c9ad83fed07de1263",
"assets/assets/dark_light.flr": "cc20eafed2e2ab6cc7f884c234a53c29",
"assets/assets/dart.png": "65d30a8592fab869e4793dae7918ab35",
"assets/assets/discord.png": "c781acaa58506204ae619002cda6aa0e",
"assets/assets/dotnet.png": "e6261297429aaac4122232a5107855e7",
"assets/assets/email.png": "6cb19ba75a85811bb0cbd05a66b9418a",
"assets/assets/english.png": "05405f43303de96968f2edba4eac618c",
"assets/assets/express.png": "85e8e7d358fbc541eb11d0bd578325bd",
"assets/assets/flutter.png": "1cf8b4ae4491ac40f4d0e702cbe67420",
"assets/assets/github.png": "bd3358c48b50aba901bff68c551d5ddc",
"assets/assets/github_small.png": "aa668a7f4993f6f259b6ae96a04bd8f7",
"assets/assets/greekflag.png": "cfe0a31b61286b087bf869588a7a5962",
"assets/assets/html5.png": "9fd05b2cc3aa9376ddd69efc1f9e1a9d",
"assets/assets/java.png": "5ab32daa924b6771f01bf684b36f2e4a",
"assets/assets/javascript.png": "ada7730e7b626fbd3e530548791b3fe6",
"assets/assets/jquery.png": "671739424c67efbbdc9564aeb1cd201e",
"assets/assets/linked.png": "043f78f1830f1d4487b0d422fead8f73",
"assets/assets/mongodb.png": "2edbf58d136936b00a2b3fd1a6ca78c3",
"assets/assets/nodejs.png": "8808128f1ead7f62baa78bd3ee5e728e",
"assets/assets/npm.png": "a99b4b6493e662ced9a4626e1424779b",
"assets/assets/photoshop.png": "d8c7e87ec8a297dda31cb2dd1712f915",
"assets/assets/postgresql.png": "0243fb555e912d062cf519d9fce97f10",
"assets/assets/programmer.json": "b6a331a54f98cd1745bd6a91a2541a48",
"assets/assets/react.png": "35162eab326bea3feae51d7b46f467be",
"assets/FontManifest.json": "7b2a36307916a9721811788013e65289",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/NOTICES": "3b70c934063f7479801610176cdb21c0",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"index.html": "684611615a50ca481dd3cc20024fe39f",
"/": "684611615a50ca481dd3cc20024fe39f",
"main.dart.js": "07d1e1da6c023e48adb8ccece4e225d7",
"manifest.json": "61c8e41a601c286b6e3621cd38b9332a",
"version.json": "028c14696d53e195e1e123108d6f3528"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
