import {
  decode,
  verify,
  SigningKeyCallback,
  VerifyErrors,
  JwtHeader,
  TokenExpiredError,
  NotBeforeError
} from 'jsonwebtoken';

import KeyStore from './keystore';
import { DecodedToken } from './types';
import { JwtVerifierError } from './errors';
import { validateConfiguration, JwtVerifierOptions } from './config';

export { JwtVerifierOptions } from './config';
export { ConfigurationError, JwtVerifierError } from './errors';

export default class JwtVerifier {
  private keyStore: KeyStore;

  private options: JwtVerifierOptions;

  constructor(options: JwtVerifierOptions) {
    validateConfiguration(options);

    this.options = options;
    this.keyStore = new KeyStore({
      requestsPerMinute: 10,
      cacheSize: 5,
      cacheTTL: 10 * 60000,
      issuer: options.issuer
    });
  }

  /**
   * Dynamically provide a key when validating a token.
   * @param header
   * @param cb
   */
  private keyProvider = async (header: JwtHeader, cb: SigningKeyCallback) => {
    try {
      if (typeof header === 'undefined' || header === null) {
        throw new JwtVerifierError('jwt_invalid', `The provided token does not contain a header`);
      }

      if (typeof header.kid !== 'string' || header.kid === null) {
        throw new JwtVerifierError(
          'jwt_invalid',
          `The provided token does not contain a valid 'kid' claim, got '${typeof header.kid}'`
        );
      }

      const jwk = await this.keyStore.getKey(header.kid);
      return cb(null, jwk.key);
    } catch (err) {
      return cb(err);
    }
  };

  /**
   * Verify an access token.
   * @param jwt
   */
  verifyAccessToken(jwt: string): Promise<DecodedToken> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof jwt === 'undefined' || jwt === null) {
          return reject(new JwtVerifierError('jwt_missing', 'No token provided'));
        }

        const decoded = decode(jwt, { complete: true }) as {
          [key: string]: any;
        };

        if (decoded === null || decoded.header === null) {
          return reject(new JwtVerifierError('jwt_invalid', 'Invalid token provided'));
        }

        if (decoded.header.alg !== 'RS256') {
          return reject(new JwtVerifierError('jwt_invalid', `Invalid 'alg' provided, got '${decoded.header.alg}'`));
        }

        if (decoded.payload.iss !== this.options.issuer) {
          return reject(
            new JwtVerifierError('jwt_invalid', `Invalid issuer (iss) provided, got '${decoded.payload.iss}'`)
          );
        }

        const audience = Array.isArray(decoded.payload.aud) ? decoded.payload.aud : [decoded.payload.aud];
        if (audience.indexOf(this.options.audience) === -1) {
          return reject(
            new JwtVerifierError('jwt_invalid', `Invalid audience (aud) provided, got '${audience.join(', ')}'`)
          );
        }
      } catch (e) {
        return reject(new JwtVerifierError('unknown_error', e.message));
      }

      return verify(
        jwt,
        this.keyProvider,
        { audience: this.options.audience, issuer: this.options.issuer },
        async (err: VerifyErrors | null, decoded: any) => {
          if (err) {
            // Token expired, change the error.
            if (err.name === 'TokenExpiredError') {
              const expiration = (err as TokenExpiredError).expiredAt;
              if (expiration) {
                return reject(
                  new JwtVerifierError('jwt_expired', `The provided token expired at '${expiration.toISOString()}'`)
                );
              }

              return reject(new JwtVerifierError('jwt_expired', `The provided token expired`));
            }

            // Token cannot be used yet, change the error.
            if (err.name === 'NotBeforeError') {
              const { date } = err as NotBeforeError;
              if (date) {
                return reject(
                  new JwtVerifierError(
                    'jwt_invalid',
                    `The provided token cannot be used before '${date.toISOString()}'`
                  )
                );
              }

              return reject(new JwtVerifierError('jwt_invalid', `The provided token cannot be used yet`));
            }

            return reject(new JwtVerifierError('jwt_invalid', err.message));
          }

          let claims = decoded;

          if (this.options.mapClaims) {
            try {
              claims = await this.options.mapClaims(claims);
              if (typeof claims === 'undefined' || claims === null) {
                return reject(
                  new JwtVerifierError('claims_mapping', 'The mapClaims function returned an empty object')
                );
              }
            } catch (e) {
              return reject(new JwtVerifierError('claims_mapping', e.message));
            }
          }

          return resolve(claims as Record<string, unknown>);
        }
      );
    });
  }
}

/**
 * Helper to convert a claim value to an array.
 */
export function claimToArray(val: string): Array<string> {
  if (typeof val === 'undefined' || val === null) {
    return [];
  }

  if (Array.isArray(val)) {
    return val;
  }

  if (typeof val !== 'string') {
    return [val];
  }

  return Array.from(val.split(' '));
}

/**
 * Helper to remove namespaces from your claims.
 */
export function removeNamespaces(namespace: string, claims: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(claims)
    .map(([key, value]) => [key.replace(namespace, ''), value])
    .reduce((acc: any, cur) => {
      const [key, value] = cur;
      acc[key as string] = value;
      return acc;
    }, {});
}

/**
 * Get the token from the Authorization header
 * @param header
 */
export function getTokenFromHeader(header: string): string {
  if (typeof header === 'undefined' || header === null) {
    throw new JwtVerifierError('invalid_header', `The Authorization header is missing or empty`);
  }

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new JwtVerifierError('invalid_header', `Unsupported format for the Authorization header`);
  }

  return parts[1];
}

module.exports = JwtVerifier;
module.exports.claimToArray = claimToArray;
module.exports.removeNamespaces = removeNamespaces;
module.exports.getTokenFromHeader = getTokenFromHeader;
