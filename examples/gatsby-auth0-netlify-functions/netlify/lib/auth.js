const { NetlifyJwtVerifier, removeNamespaces, claimToArray } = require('@serverless-jwt/netlify');

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
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
  /**
   * Helper function to process the token claims before executing the function.
   */
  mapClaims: (claims) => {
    // Custom claims added in Auth0 have a prefix, which are removed here.
    const user = removeNamespaces('http://schemas.sandrino.dev/', claims);

    // Convert the scope and roles claims to arrays so they are easier to work with.
    user.scope = claimToArray(user.scope);
    user.roles = claimToArray(user.roles);
    return user;
  }
});

/**
 * Require the request to be authenticated.
 */
module.exports.requireAuth = verifyJwt;

/**
 * Require the token to contain a certain scope.
 * @param {string} scope
 * @param {*} handler
 */
module.exports.requireScope = (scope, handler) =>
  verifyJwt(async (event, context, cb) => {
    const { claims } = context.identityContext;

    // Require the token to contain a specific scope.
    if (!claims || !claims.scope || claims.scope.indexOf(scope) === -1) {
      return json(403, {
        error: 'access_denied',
        error_description: `Token does not contain the required '${scope}' scope`
      });
    }

    // Continue.
    return handler(event, context, cb);
  });

/**
 * Require the user to have a specific role.
 * @param {string} role
 * @param {*} handler
 */
module.exports.requireRole = (role, handler) =>
  verifyJwt(async (event, context, cb) => {
    const { claims } = context.identityContext;

    // Require the user to have a specific role.
    if (!claims || !claims.roles || claims.roles.indexOf(role) === -1) {
      return json(403, {
        error: 'access_denied',
        error_description: `User does not have the '${role}' role`
      });
    }

    // Continue.
    return handler(event, context, cb);
  });
