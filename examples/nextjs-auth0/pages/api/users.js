import { NextJwtVerifier } from '@serverless-jwt/next';

const jwt = NextJwtVerifier({
  issuer: 'https://sandrino-dev.auth0.com/',
  audience: 'urn:worldmappers-api'
});

export default jwt(async (req, res) => {
  const { claims } = req.identityContext;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ name: 'John Doe', user: claims }));
});
