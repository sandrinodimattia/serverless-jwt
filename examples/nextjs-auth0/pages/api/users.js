import { NextJwtVerifier } from '@serverless-jwt/next';

const jwt = NextJwtVerifier({
  issuer: 'https://sandrino-dev.auth0.com/',
  audience: 'urn:worldmappers'
});

export default jwt(async (req, res) => {
  const { claims } = req.identityContext;
  res.json({
    user: claims
  });
});
