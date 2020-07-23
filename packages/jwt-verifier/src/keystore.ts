import memoizer from 'lru-memoizer';
import { RateLimiter } from 'limiter';
import { JwtVerifierError } from './errors';

import MetadataClient, { JsonWebKey } from './metadata';
import { certToPEM, rsaPublicKeyToPEM } from './utils';

interface KeyStoreOptions {
  /**
   * Issuer URI.
   */
  issuer: string;

  /**
   * Maximum requests per minute for new KIDs.
   */
  requestsPerMinute: number;

  /**
   * Number of signing certs to cache.
   */
  cacheSize: number;

  /**
   * Cache duration.
   */
  cacheTTL: number;
}

export default class KeyStore {
  /**
   * Helper to cache a given key.
   */
  private getKeyCached: any;

  /**
   * Metadata client to load the keyset.
   */
  private metadataClient: MetadataClient;

  constructor(options: KeyStoreOptions) {
    this.metadataClient = new MetadataClient(options.issuer);

    // Hack to solve typing issues.
    const cache = memoizer as any;

    // Rate limiter to prevent taking the service down.
    const limiter = new RateLimiter(options.requestsPerMinute, 'minute', true);

    // Add a caching function to make sure we're not adding too much of a delay when validating tokens.
    this.getKeyCached = cache({
      load: (kid: string, callback: (err: Error | null, key?: JsonWebKey) => void): void => {
        limiter.removeTokens(1, (err, remaining) => {
          if (err) {
            return callback(err);
          }

          if (remaining < 0) {
            return callback(
              new JwtVerifierError(
                'jwks_rate_limit',
                `Too many requests have been made to the JSON Web Key Set endpoint (last kid: '${kid}')`
              )
            );
          }

          return this.getSigningKeys()
            .then((keys) => {
              const key = keys.find((k) => k.kid === kid);
              if (!key) {
                return callback(
                  new JwtVerifierError('jwks_kid_error', `Unable to find key '${kid}' in the JSON Web Key Set`)
                );
              }

              return callback(null, key);
            })
            .catch((metadataErr) => callback(metadataErr));
        });
      },
      hash: (kid: string) => kid,
      maxAge: options.cacheTTL,
      max: options.cacheSize
    });
  }

  /**
   * Get all usable keys from the JSON Web Key endpoint.
   */
  async getSigningKeys(): Promise<Array<JsonWebKey>> {
    function parseKey(signingKey: any): string {
      if (typeof signingKey.x5c !== 'undefined' && signingKey.x5c !== null && signingKey.x5c.length) {
        return certToPEM(signingKey.x5c[0]);
      }

      return rsaPublicKeyToPEM(signingKey.n, signingKey.e);
    }

    const keys = await this.metadataClient.getJsonWebKeySet();
    const signingKeys = keys.filter((key: Record<string, unknown>) => {
      if (typeof key.use !== 'undefined' && key.use !== null && key.use !== 'sig') {
        return false;
      }

      return key.kty === 'RSA' && ((key.x5c && (key.x5c as Array<string>).length) || (key.n && key.e));
    });

    if (!signingKeys.length) {
      throw new JwtVerifierError('jwks_error', `Unable to find key any usable keys in the JSON Web Key Set`);
    }

    return signingKeys.map((signingKey: any) => {
      const jwk: JsonWebKey = {
        kid: signingKey.kid,
        nbf: signingKey.nbf,
        key: parseKey(signingKey)
      };

      return jwk;
    });
  }

  /**
   * Get a JSON Web Key from the cache.
   * @param kid
   */
  getKey(kid: string): Promise<JsonWebKey> {
    return new Promise((resolve, reject) => {
      this.getKeyCached(kid, (err: Error, key: JsonWebKey) => {
        if (err) {
          return reject(err);
        }

        return resolve(key);
      });
    });
  }
}
