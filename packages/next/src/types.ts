import { NextApiResponse, NextApiRequest } from 'next';
import { JwtVerifierOptions, JwtVerifierError } from '@serverless-jwt/jwt-verifier';

export interface NextJwtVerifierOptions extends JwtVerifierOptions {
  /**
   * Customize how errors are handled.
   */
  handleError?(res: NextApiResponse, err: Error | JwtVerifierError): Promise<void>;
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

export interface NextAuthenticatedApiRequest extends NextApiRequest {
  /**
   * The user identity for the current request.
   */
  identityContext: IdentityContext;
}
