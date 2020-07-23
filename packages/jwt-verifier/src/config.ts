import { DecodedToken } from './types';

export interface JwtVerifierOptions {
  /**
   * Issuer to validate (eg: https://auth.sandrino.dev/)
   */
  issuer: string;

  /**
   * Audience to validate (eg: https://my.com/api)
   */
  audience: string;

  /**
   * Function which allows you to map claims.
   */
  mapClaims?: (token: DecodedToken) => Promise<DecodedToken>;
}

function optionalFunction(setting: string, value: any) {
  if (typeof value === 'undefined' || value === null) {
    return;
  }

  if (typeof value !== 'function' || value === null) {
    throw new TypeError(`Expected '${setting}' to be a function, got '${typeof value}'`);
  }
}

function requireString(setting: string, value: any) {
  if (typeof value !== 'string' || value === null) {
    throw new TypeError(`Expected '${setting}' to be string, got '${typeof value}'`);
  }

  if (value.length === 0) {
    throw new TypeError(`Expected '${setting}' to be a valid string, got '${value}'`);
  }
}

function requireUri(setting: string, value: any) {
  if (!value.match(/^http:\/\/|^https:\/\//)) {
    throw new TypeError(`Expected '${setting}' to be a valid http(s) uri, got '${value}'`);
  }
}

export function validateConfiguration(options: JwtVerifierOptions): void {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('A valid configuration object must be provided');
  }

  requireString('issuer', options.issuer);
  requireUri('issuer', options.issuer);
  requireString('audience', options.audience);
  optionalFunction('mapClaims', options.mapClaims);
}
