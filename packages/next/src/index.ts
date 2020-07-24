import { NextApiResponse, NextApiRequest } from 'next';
import { JwtVerifier, getTokenFromHeader } from '@serverless-jwt/jwt-verifier';
import { NextJwtVerifierOptions, IApiRoute, NextAuthenticatedApiRequest } from './types';

/**
 * Middleware to validate a token and set the user context.
 */
const validateJWT = (verifier: JwtVerifier, options: NextJwtVerifierOptions) => {
  return (apiRoute: IApiRoute): IApiRoute => async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
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
        return options.handleError(res, err);
      }

      return res.status(401).json({
        error: err.code,
        error_description: err.message
      });
    }

    // Expose the identity in the client context.
    const authenticatedRequest = req as NextAuthenticatedApiRequest;
    authenticatedRequest.identityContext = {
      token: accessToken as string,
      claims: claims as Record<string, unknown>
    };

    // Continue.
    return apiRoute(req, res);
  };
};

export interface NextJwtVerifier {
  (apiRoute: IApiRoute): (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
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
