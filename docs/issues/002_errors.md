2026-02-08 18:59:45.368 [error] Error: Failed to load external module jsdom-fcdca64395ad41f5: Error [ERR_REQUIRE_ESM]: require() of ES Module /var/task/node_modules/.pnpm/@exodus+bytes@1.11.0_@noble+hashes@1.8.0/node_modules/@exodus/bytes/encoding-lite.js from /var/task/node_modules/.pnpm/html-encoding-sniffer@6.0.0_@noble+hashes@1.8.0/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js not supported.
Instead change the require of encoding-lite.js in /var/task/node_modules/.pnpm/html-encoding-sniffer@6.0.0_@noble+hashes@1.8.0/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js to a dynamic import() which is available in all CommonJS modules.
    at Context.externalRequire [as x] (.next/server/chunks/ssr/[turbopack]_runtime.js:535:15)
    at module evaluation (.next/server/chunks/ssr/[root-of-the-server]__68d78f22._.js:1:2343)
    at instantiateModule (.next/server/chunks/ssr/[turbopack]_runtime.js:740:9)
    at getOrInstantiateModuleFromParent (.next/server/chunks/ssr/[turbopack]_runtime.js:763:12)
    at Context.esmImport [as i] (.next/server/chunks/ssr/[turbopack]_runtime.js:228:20)
    at module evaluation (.next/server/chunks/ssr/_00e8b546._.js:1:33819)
    at instantiateModule (.next/server/chunks/ssr/[turbopack]_runtime.js:740:9)
    at getOrInstantiateModuleFromParent (.next/server/chunks/ssr/[turbopack]_runtime.js:763:12)
    at Context.esmImport [as i] (.next/server/chunks/ssr/[turbopack]_runtime.js:228:20)
    at module evaluation (.next/server/chunks/ssr/[root-of-the-server]__68d78f22._.js:1:4713) {
  page: '/i/michael-schwarz-501474/articles'
}

2026-02-08 18:59:45.371 [error] ⨯ Error: Failed to load static file for page: /500 ENOENT: no such file or directory, open '/var/task/.next/server/pages/500.html'
    at async Object.handler (___next_launcher.cjs:57:3)
2026-02-08 18:59:45.372 [error] Error: Failed to load external module jsdom-fcdca64395ad41f5: Error [ERR_REQUIRE_ESM]: require() of ES Module /var/task/node_modules/.pnpm/@exodus+bytes@1.11.0_@noble+hashes@1.8.0/node_modules/@exodus/bytes/encoding-lite.js from /var/task/node_modules/.pnpm/html-encoding-sniffer@6.0.0_@noble+hashes@1.8.0/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js not supported.
Instead change the require of encoding-lite.js in /var/task/node_modules/.pnpm/html-encoding-sniffer@6.0.0_@noble+hashes@1.8.0/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js to a dynamic import() which is available in all CommonJS modules.
    at Context.externalRequire [as x] (.next/server/chunks/ssr/[turbopack]_runtime.js:535:15)
    at module evaluation (.next/server/chunks/ssr/[root-of-the-server]__68d78f22._.js:1:2343)
    at instantiateModule (.next/server/chunks/ssr/[turbopack]_runtime.js:740:9)
    at getOrInstantiateModuleFromParent (.next/server/chunks/ssr/[turbopack]_runtime.js:763:12)
    at Context.esmImport [as i] (.next/server/chunks/ssr/[turbopack]_runtime.js:228:20)
    at module evaluation (.next/server/chunks/ssr/_00e8b546._.js:1:33819)
    at instantiateModule (.next/server/chunks/ssr/[turbopack]_runtime.js:740:9)
    at getOrInstantiateModuleFromParent (.next/server/chunks/ssr/[turbopack]_runtime.js:763:12)
    at Context.esmImport [as i] (.next/server/chunks/ssr/[turbopack]_runtime.js:228:20)
    at module evaluation (.next/server/chunks/ssr/[root-of-the-server]__68d78f22._.js:1:4713) {
  page: '/i/michael-schwarz-501474/articles'
}

2026-02-08 19:00:00.841 [error] Error: Event handlers cannot be passed to Client Component props.
  {data-slot: "button", data-variant: ..., data-size: ..., className: ..., onClick: function onClick, children: ...}
                                                                                    ^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
    at stringify (<anonymous>) {
  digest: '2626384772'
}

Those two errors appeared. Also when selecting a newspaper to have a preview I do get
Application error: a server-side exception has occurred while loading memento-app-delta.vercel.app (see the server logs for more information).
Digest: 2626384772
8b72cfc40036c827.js:1 Uncaught Error: An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.
