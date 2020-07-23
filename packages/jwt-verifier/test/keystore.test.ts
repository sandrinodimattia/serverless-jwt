import timekeeper from 'timekeeper';

import KeyStore from '../src/keystore';
import { JwtVerifierError } from '../src/errors';
import { openidConfiguration, jwks, jwksInvalidKeys, jwksFailure } from './helpers/oidc';

describe('#keystore', () => {
  const issuer = 'https://auth.local';

  beforeEach(() => {
    openidConfiguration(issuer);
  });

  it('should handle metadata failures', () => {
    expect.assertions(3);
    jwksFailure(issuer);

    const keystore = new KeyStore({
      issuer,
      requestsPerMinute: 10,
      cacheSize: 10,
      cacheTTL: 1000
    });

    return keystore.getKey('abc').catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('http_error');
      expect(e.message).toMatch(`Failed to fetch 'https://auth.local/.well-known/jwks.json': 429 Too Many Requests`);
    });
  });

  it('should handle no keys available', () => {
    expect.assertions(3);
    jwksInvalidKeys(issuer);

    const keystore = new KeyStore({
      issuer,
      requestsPerMinute: 10,
      cacheSize: 10,
      cacheTTL: 1000
    });

    return keystore.getKey('abc').catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('jwks_error');
      expect(e.message).toMatch(`Unable to find key any usable keys in the JSON Web Key Set`);
    });
  });

  it('should handle key not found', () => {
    expect.assertions(3);
    jwks(issuer);

    const keystore = new KeyStore({
      issuer,
      requestsPerMinute: 10,
      cacheSize: 10,
      cacheTTL: 1000
    });

    return keystore.getKey('abc').catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('jwks_kid_error');
      expect(e.message).toMatch(`Unable to find key 'abc' in the JSON Web Key Set`);
    });
  });

  it('should suport rate limiting', async () => {
    expect.assertions(3);

    const keystore = new KeyStore({
      issuer,
      requestsPerMinute: 2,
      cacheSize: 10,
      cacheTTL: 1000
    });

    jwks(issuer);
    await keystore.getKey('123');

    jwks(issuer);
    await keystore.getKey('456');

    return keystore.getKey('789').catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('jwks_rate_limit');
      expect(e.message).toMatch(`Too many requests have been made to the JSON Web Key Set endpoint (last kid: '789')`);
    });
  });

  it('should support caching', async () => {
    expect.assertions(1);

    const keystore = new KeyStore({
      issuer,
      requestsPerMinute: 1,
      cacheSize: 10,
      cacheTTL: 1000
    });

    jwks(issuer);
    await keystore.getKey('123');
    await keystore.getKey('123');
    await keystore.getKey('123');

    const key = await keystore.getKey('123');
    expect(key.kid).toBe('123');
  });

  it('should honor the cache ttl', async () => {
    expect.assertions(3);

    const keystore = new KeyStore({
      issuer,
      requestsPerMinute: 2,
      cacheSize: 10,
      cacheTTL: 250
    });

    jwks(issuer);
    await keystore.getKey('123');

    timekeeper.travel(new Date().getTime() + 1000);

    jwksFailure(issuer);
    return keystore.getKey('123').catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('http_error');
      expect(e.message).toMatch(`Failed to fetch 'https://auth.local/.well-known/jwks.json': 429 Too Many Requests`);
    });
  });
});
