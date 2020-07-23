import wretch from 'wretch';
import nodeFetch from 'node-fetch';
import { STATUS_CODES } from 'http';
import { URLSearchParams } from 'url';
import { AbortController, abortableFetch } from 'abortcontroller-polyfill/dist/cjs-ponyfill';

import { semaphore } from './utils';
import { JwtVerifierError } from './errors';

function get(url: string): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    wretch(url)
      .polyfills({ fetch: abortableFetch(nodeFetch).fetch, URLSearchParams, AbortController })
      .get()
      .setTimeout(10000)
      .json()
      .then((res) => resolve(res))
      .catch((e) => {
        if (e.name === 'AbortError') {
          return reject(new JwtVerifierError('timeout_error', `Failed to fetch '${url}': Request timed out`));
        }

        if (e.status) {
          return reject(
            new JwtVerifierError('http_error', `Failed to fetch '${url}': ${e.status} ${STATUS_CODES[e.status]}`)
          );
        }

        return reject(
          new JwtVerifierError('network_error', `Failed to fetch '${url}': ${e.code || e.errno || e.message}`)
        );
      });
  });
}

export interface JsonWebKey {
  kid: string;
  nbf: string;
  key: string;
}

export default class MetadataClient {
  /**
   * The base url for the issuer (eg: https://login.acme.com/)
   */
  private baseUrl: string;

  /**
   * The full JWKS uri, provided directly or loaded from the metadata (eg: https://login.acme.com/.well-known/jwks.json)
   */
  private jwksUri: string | undefined;

  /**
   * Semaphore to control concurrency.
   */
  private metadataSemaphore: (fn: () => any) => Promise<any>;

  constructor(issuer: string, jwksUri?: string) {
    this.jwksUri = jwksUri;
    this.baseUrl = issuer.replace(/\/$/, '');
    this.metadataSemaphore = semaphore();
  }

  /**
   * Get the OpenID configuration.
   */
  getOpenIdConfiguration(): Promise<{ [key: string]: any }> {
    const metadataUrl = `${this.baseUrl}/.well-known/openid-configuration`;
    return get(metadataUrl);
  }

  /**
   * Get the JSON Web Key Set url (from config or from metadata).
   */
  async getJsonWebKeySetUrl(): Promise<string> {
    if (typeof this.jwksUri !== 'undefined' && this.jwksUri !== null) {
      return this.jwksUri;
    }

    const metadata = await this.metadataSemaphore(() => this.getOpenIdConfiguration());
    if (typeof metadata.jwks_uri === 'undefined' || metadata.jwks_uri === null) {
      throw new JwtVerifierError(
        'openid_configuration',
        'The OpenID configuration endpoint does not contain a valid jwks_uri'
      );
    }

    this.jwksUri = metadata.jwks_uri as string;
    return this.jwksUri;
  }

  /**
   * Get the JSON Web Key Set.
   */
  async getJsonWebKeySet(): Promise<Array<{ [key: string]: any }>> {
    const jwksUri = await this.getJsonWebKeySetUrl();

    const res = await get(jwksUri);
    if (!res.keys) {
      throw new JwtVerifierError('jwks_error', 'The JSON Web Key Set does not contain any keys');
    }

    return res.keys;
  }
}
