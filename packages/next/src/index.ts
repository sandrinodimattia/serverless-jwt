import { NextApiResponse, NextApiRequest, NextApiHandler } from 'next';
import { JwtVerifier, getTokenFromHeader, JwtVerifierError } from '@serverless-jwt/jwt-verifier';
import { NextJwtVerifierOptions, NextAuthenticatedApiRequest } from './types';

/**
 * Middleware to validate a token and set the user context.
 */
const validateJWT = (verifier: JwtVerifier, options: NextJwtVerifierOptions) => {
  return (handler: NextApiHandler): NextApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (!req) {
        throw new Error('Request is not available');
      }

      if (!res) {
        throw new Error('Response is not available');
      }

      let claims;
      let accessToken;

      try {
        accessToken = getTokenFromHeader(req.headers.authorization as string);
        claims = await verifier.verifyAccessToken(accessToken);
      } catch (err) {
        if (typeof options.handleError !== 'undefined' && options.handleError !== null) {
          return options.handleError(res, err as JwtVerifierError);
        }

        const verifyError = err as JwtVerifierError;
        return res.status(401).json({
          error: verifyError.code,
          error_description: verifyError.message
        });
      }

      // Expose the identity in the client context.
      const authenticatedRequest = req as NextAuthenticatedApiRequest;
      authenticatedRequest.identityContext = {
        token: accessToken as string,
        claims: claims as Record<string, unknown>
      };

      // Continue.
      return handler(req, res);
    };
  };
};

interface NextJwtVerifier {
  (handler: NextApiHandler): NextApiHandler;
}

/**
 * Create a JWT verifier handler.
 * @param options
 */
export const NextJwtVerifier = (options: NextJwtVerifierOptions): NextJwtVerifier => {
  const verifier = new JwtVerifier(options);
  return validateJWT(verifier, options);
};

export { claimToArray, removeNamespaces, getTokenFromHeader } from '@serverless-jwt/jwt-verifier';
