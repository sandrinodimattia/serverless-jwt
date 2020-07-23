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

const requireRole = (role, handler) =>
  verifyJwt(async (event, context, cb) => {
    const { user } = context.identityContext;
    if (typeof user === 'undefined' || user === null) {
      throw new Error('Not authenticated');
    }

    if (user.roles.indexOf(role) === -1) {
      return json(403, {
        error: 'forbidden',
        error_description: `User does not have the '${role}' role`
      });
    }

    // Continue.
    return handler(event, context, cb);
  });

exports.handler = requireRole('admin', async (event, context) => {
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
