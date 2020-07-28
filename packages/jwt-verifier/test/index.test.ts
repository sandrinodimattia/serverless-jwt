import { JwtVerifier, removeNamespaces, claimToArray } from '../src/index';
import { JwtVerifierError } from '../src/errors';

import { privateKey } from './helpers/certs';
import { openidConfiguration, jwks } from './helpers/oidc';
import { createToken, createNoneToken } from './helpers/tokens';

describe('#jwtVerifier', () => {
  const issuer = 'https://auth.local';
  const audience = 'https://my-api';

  beforeEach(() => {
    openidConfiguration(issuer);
    jwks(issuer);
  });

  it('should not allow other algorithms', () => {
    expect.assertions(3);
    const token = createNoneToken({
      sub: 'john'
    });

    const jwtVerifier = new JwtVerifier({
      issuer,
      audience
    });

    return jwtVerifier.verifyAccessToken(token).catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('jwt_invalid');
      expect(e.message).toMatch(`Invalid 'alg' provided, got 'none'`);
    });
  });

  it('should not allow other issuers', () => {
    expect.assertions(3);

    const token = createToken(privateKey, '123', {
      iss: 'other-issuer',
      aud: `${audience}`,
      sub: 'john',
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + 60
    });

    const jwtVerifier = new JwtVerifier({
      issuer,
      audience
    });

    return jwtVerifier.verifyAccessToken(token).catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('jwt_invalid');
      expect(e.message).toMatch(`Invalid issuer (iss) provided, got 'other-issuer'`);
    });
  });

  it('should not allow expired tokens', () => {
    expect.assertions(3);

    const token = createToken(privateKey, '123', {
      iss: issuer,
      aud: `${audience}`,
      sub: 'john',
      iat: Math.floor(Date.now() / 1000) - 2000,
      exp: Math.floor(Date.now() / 1000) - 1000
    });

    const jwtVerifier = new JwtVerifier({
      issuer,
      audience
    });

    return jwtVerifier.verifyAccessToken(token).catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('jwt_expired');
      expect(e.message).toContain(`The provided token expired at `);
    });
  });

  it('should not allow tokens which cannot be used yet', () => {
    expect.assertions(3);

    const token = createToken(privateKey, '123', {
      iss: issuer,
      aud: `${audience}`,
      sub: 'john',
      iat: Math.floor(Date.now() / 1000) + 10000,
      nbf: Math.floor(Date.now() / 1000) + 10000,
      exp: Math.floor(Date.now() / 1000) + 20000
    });

    const jwtVerifier = new JwtVerifier({
      issuer,
      audience
    });

    return jwtVerifier.verifyAccessToken(token).catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('jwt_invalid');
      expect(e.message).toContain(`The provided token cannot be used before `);
    });
  });

  it('should not allow other audiences', () => {
    expect.assertions(3);

    const token = createToken(privateKey, '123', {
      iss: issuer,
      aud: `other audience`,
      sub: 'john',
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + 60
    });

    const jwtVerifier = new JwtVerifier({
      issuer,
      audience
    });

    return jwtVerifier.verifyAccessToken(token).catch((e) => {
      expect(e).toBeInstanceOf(JwtVerifierError);
      expect(e.code).toMatch('jwt_invalid');
      expect(e.message).toMatch(`Invalid audience (aud) provided, got 'other audience'`);
    });
  });

  it('should accept valid tokens', async () => {
    const token = createToken(privateKey, '123', {
      iss: issuer,
      aud: `${audience}`,
      sub: 'john',
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + 60
    });

    const jwtVerifier = new JwtVerifier({
      issuer,
      audience
    });

    const decoded = await jwtVerifier.verifyAccessToken(token);
    expect(decoded).toEqual({
      sub: 'john',
      aud: 'https://my-api',
      exp: expect.any(Number),
      iat: expect.any(Number),
      iss: 'https://auth.local'
    });
  });

  it('should accept valid tokens with multiple audiences', async () => {
    const token = createToken(privateKey, '123', {
      iss: issuer,
      aud: ['urn:other-audience', `${audience}`],
      sub: 'john',
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + 60
    });

    const jwtVerifier = new JwtVerifier({
      issuer,
      audience
    });

    const decoded = await jwtVerifier.verifyAccessToken(token);
    expect(decoded).toEqual({
      sub: 'john',
      aud: ['urn:other-audience', `${audience}`],
      exp: expect.any(Number),
      iat: expect.any(Number),
      iss: 'https://auth.local'
    });
  });

  it('should map claims', async () => {
    const token = createToken(privateKey, '123', {
      iss: issuer,
      aud: ['urn:other-audience', `${audience}`],
      sub: 'john',
      'http://roles': 'admin user member',
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + 60
    });

    const jwtVerifier = new JwtVerifier({
      issuer,
      audience,
      mapClaims: async (claims) => {
        const identity = removeNamespaces('http://', claims);
        identity.roles = claimToArray(identity.roles as string);
        identity.scopes = claimToArray(identity.scopes as string);
        return identity;
      }
    });

    const decoded = await jwtVerifier.verifyAccessToken(token);
    expect(decoded).toEqual({
      sub: 'john',
      aud: ['urn:other-audience', `${audience}`],
      exp: expect.any(Number),
      iat: expect.any(Number),
      iss: 'https://auth.local',
      roles: ['admin', 'user', 'member'],
      scopes: []
    });
  });
});
