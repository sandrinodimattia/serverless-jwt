import { Request, Response } from 'node-fetch';
import { JwtVerifier, JwtVerifierOptions, getTokenFromHeader, JwtVerifierError } from '@serverless-jwt/jwt-verifier';

export interface CloudflareAuthenticatedWorker {
  (identityContext: IdentityContext, request: Request): Promise<Response>;
}

interface CloudflareJwtVerifier {
  (handler: CloudflareAuthenticatedWorker): (request: Request) => Promise<Response>;
}

interface CloudflareJwtVerifierOptions extends JwtVerifierOptions {
  /**
   * Customize how errors are handled.
   */
  handleError?(err: Error | JwtVerifierError): Response;
}

export interface IdentityContext {
  /**
   * The token that was provided.
   */
  token: string;

  /**
   * Claims for the authenticated user.
   */
  claims: Record<string, unknown>;
}

/**
 * Return a JSON response.
 * @param statusCode
 * @param body
 */
export const json = (statusCode: number, body: Record<string, unknown>): Response => {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    }
  });
};

/**
 * Middleware to validate a token and set the user context.
 */
const validateJWT = (verifier: JwtVerifier, options: CloudflareJwtVerifierOptions) => {
  return (handler: CloudflareAuthenticatedWorker) => async (request: Request): Promise<Response> => {
    let claims;
    let accessToken;

    try {
      accessToken = getTokenFromHeader(request.headers.get('Authorization') as string);
      claims = await verifier.verifyAccessToken(accessToken);
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
    const ctx: IdentityContext = {
      token: accessToken,
      claims
    };

    // Continue.
    return handler(ctx, request);
  };
};

/**
 * Create a JWT verifier handler.
 * @param options
 */
export const CloudflareJwtVerifier = (options: CloudflareJwtVerifierOptions): CloudflareJwtVerifier => {
  const verifier = new JwtVerifier(options);
  return validateJWT(verifier, options);
};

export { claimToArray, removeNamespaces, getTokenFromHeader } from '@serverless-jwt/jwt-verifier';
