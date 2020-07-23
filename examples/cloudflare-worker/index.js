/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

const JwtVerifier = require('../../packages/jwt-verifier/dist/src');

const jwt = new JwtVerifier({
  issuer: 'https://auth.sandrino.dev/',
  audience: 'urn:colors-api'
});

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const token = JwtVerifier.getTokenFromHeader(request.headers.get('Authorization'));
    const body = await jwt.verifyAccessToken(token);

    return new Response(`hello world: ${JSON.stringify(body, null, 2)}`);
  } catch (e) {
    return new Response(e.message);
  }
}
