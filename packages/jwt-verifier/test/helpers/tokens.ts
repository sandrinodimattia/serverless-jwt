import jwt from 'jsonwebtoken';

export function createNoneToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, '', { algorithm: 'none', header: { alg: 'none' } });
}

export function createToken(key: string, kid: string, payload: Record<string, unknown>): string {
  return jwt.sign(payload, key, { algorithm: 'RS256', header: { alg: 'RS256', kid } });
}
