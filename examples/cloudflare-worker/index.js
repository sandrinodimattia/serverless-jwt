const { CloudflareJwtVerifier } = require('@serverless-jwt/cloudflare');

const requireAuth = new CloudflareJwtVerifier({
  issuer: 'https://auth.sandrino.dev/',
  audience: 'https://api/tv-shows'
});

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

const handleRequest = requireAuth((identityContext, request) => {
  return new Response(`hello world on ${request.url}: ${JSON.stringify(identityContext.claims, null, 2)}`);
});
