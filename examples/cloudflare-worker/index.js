const { JwtVerifier, getTokenFromHeader } = require('@serverless-jwt/jwt-verifier');

const jwt = new JwtVerifier({
  issuer: 'https://auth.sandrino.dev/',
  audience: 'urn:colors-api'
});

addEventListener('fetch', (event) => {
  console.log(event);
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const token = getTokenFromHeader(request.headers.get('Authorization'));
    const body = await jwt.verifyAccessToken(token);

    return new Response(`hello world: ${JSON.stringify(body, null, 2)}`);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.code, error_description: e.message }), {
      status: 400,
      headers: {
        'content-type': 'application/json;charset=UTF-8'
      }
    });
  }
}
