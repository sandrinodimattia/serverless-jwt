import { JwtVerifier, JwtVerifierOptions, getTokenFromHeader, JwtVerifierError } from '@serverless-jwt/jwt-verifier';

interface Event {
  headers: Record<string, unknown>;
}

interface NetlifyJwtVerifier {
  (handler: any): (event: Event, context: any, cb: any) => Promise<any>;
}

interface NetlifyJwtVerifierOptions extends JwtVerifierOptions {
  /**
   * Customize how errors are handled.
   */
  handleError?(err: Error | JwtVerifierError): Record<string, unknown>;
}

/**
 * Return a JSON response.
 * @param statusCode
 * @param body
 */
const json = (statusCode: number, body: Record<string, unknown>) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
};

/**
 * Middleware to validate a token and set the user context.
 */
const validateJWT = (verifier: JwtVerifier, options: NetlifyJwtVerifierOptions) => {
  return (handler: any) => async (event: Event, context: any, cb: any) => {
    let user;
    let accessToken;

    try {
      accessToken = getTokenFromHeader(event.headers.authorization as string);
      user = await verifier.verifyAccessToken(accessToken);
    } catch (err) {
      if (typeof options.handleError !== 'undefined' && options.handleError !== null) {
        return options.handleError(err);
      }

      return json(401, {
        error: err.code,
        error_description: err.message
      });
    }

    // Expose the identity in the client context.
    context.identityContext = {
      token: accessToken,
      user
    };

    // Continue.
    return handler(event, context, cb);
  };
};

/**
 * Create a JWT verifier handler.
 * @param options
 */
export const NetlifyJwtVerifier = (options: NetlifyJwtVerifierOptions): NetlifyJwtVerifier => {
  const verifier = new JwtVerifier(options);
  return validateJWT(verifier, options);
};

export { claimToArray, removeNamespaces, getTokenFromHeader } from '@serverless-jwt/jwt-verifier';
