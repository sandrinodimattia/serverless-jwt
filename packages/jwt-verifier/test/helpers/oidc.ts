import nock from 'nock';
import { publicKey, randomPublicKey1 } from './certs';

function createConfig(issuer: string) {
  return {
    issuer: `${issuer}/`,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/userinfo`,
    mfa_challenge_endpoint: `${issuer}/mfa/challenge`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    registration_endpoint: `${issuer}/oidc/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    scopes_supported: [
      'openid',
      'profile',
      'offline_access',
      'name',
      'given_name',
      'family_name',
      'nickname',
      'email',
      'email_verified',
      'picture',
      'created_at',
      'identities',
      'phone',
      'address'
    ],
    response_types_supported: [
      'code',
      'token',
      'id_token',
      'code token',
      'code id_token',
      'token id_token',
      'code token id_token'
    ],
    code_challenge_methods_supported: ['S256', 'plain'],
    response_modes_supported: ['query', 'fragment', 'form_post'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256', 'RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    claims_supported: [
      'aud',
      'auth_time',
      'created_at',
      'email',
      'email_verified',
      'exp',
      'family_name',
      'given_name',
      'iat',
      'identities',
      'iss',
      'name',
      'nickname',
      'phone_number',
      'picture',
      'sub'
    ],
    request_uri_parameter_supported: false,
    device_authorization_endpoint: `${issuer}/oauth/device/code`
  };
}

export function openidConfiguration(issuer: string): nock.Scope {
  return nock(issuer).get('/.well-known/openid-configuration').reply(200, createConfig(issuer));
}

export function openidConfigurationNetworkFailure(issuer: string): nock.Scope {
  return nock(issuer).get('/.well-known/openid-configuration').replyWithError({
    code: 'ENOTFOUND',
    message: 'ENOTFOUND'
  });
}
export function openidConfigurationFailure(issuer: string): nock.Scope {
  return nock(issuer).get('/.well-known/openid-configuration').reply(429, {
    error: 'Rate limited'
  });
}

export function openidConfigurationSlow(issuer: string, timeout: number): nock.Scope {
  return nock(issuer).get('/.well-known/openid-configuration').delay(timeout).reply(200, createConfig(issuer));
}

function x5c(cert: string) {
  const key = /-----BEGIN CERTIFICATE-----([^-]*)-----END CERTIFICATE-----/g.exec(cert);
  if (!key) {
    throw new Error(`Invalid key: ${cert}`);
  }

  return key[1].replace(/[\n|\r\n]/g, '');
}

function createJwks() {
  return {
    keys: [
      {
        alg: 'RS256',
        kty: 'RSA',
        use: 'sig',
        x5c: [x5c(publicKey)],
        kid: '123'
      },
      {
        alg: 'RS256',
        kty: 'RSA',
        use: 'sig',
        x5c: [x5c(randomPublicKey1)],
        kid: '456'
      }
    ]
  };
}

export function jwks(issuer: string): nock.Scope {
  return nock(issuer).get('/.well-known/jwks.json').reply(200, createJwks());
}
export function jwksInvalidKeys(issuer: string): nock.Scope {
  return nock(issuer)
    .get('/.well-known/jwks.json')
    .reply(200, {
      keys: [
        {
          use: 'something',
          x5c: [x5c(publicKey)],
          kid: '123'
        },
        {
          use: 'something',
          x5c: [x5c(randomPublicKey1)],
          kid: '456'
        }
      ]
    });
}

export function jwksNetworkFailure(issuer: string): nock.Scope {
  return nock(issuer).get('/.well-known/jwks.json').replyWithError({
    code: 'ENOTFOUND',
    message: 'ENOTFOUND'
  });
}
export function jwksFailure(issuer: string): nock.Scope {
  return nock(issuer).get('/.well-known/jwks.json').reply(429, {
    error: 'Rate limited'
  });
}

export function jwksSlow(issuer: string, timeout: number): nock.Scope {
  return nock(issuer).get('/.well-known/jwks.json').delay(timeout).reply(200, createJwks());
}
