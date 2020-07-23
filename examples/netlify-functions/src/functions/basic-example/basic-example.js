const NetlifyJwtVerifier = require('@serverless-jwt/netlify');

const json = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
};

const verifyJwt = NetlifyJwtVerifier({
  issuer: 'https://auth.sandrino.dev/',
  audience: 'urn:colors-api',
  mapClaims: async (claims) => {
    const identity = NetlifyJwtVerifier.removeNamespaces('http://sandrino/', claims);
    return identity;
  }
});

exports.handler = verifyJwt(async (event, context) => {
  const { user } = context.identityContext;

  try {
    return json(200, {
      msg: 'hello',
      user
    });
  } catch (err) {
    return { statusCode: 500, body: err.toString() };
  }
});
