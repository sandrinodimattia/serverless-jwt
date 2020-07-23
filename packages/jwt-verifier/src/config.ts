export interface JwtVerifierOptions {
  issuer: string;
  audience: string;
}

function requireString(setting: string, value: any) {
  if (typeof value !== 'string' || value === null) {
    throw new TypeError(`Expected '${setting}' to be string, got ${typeof value}`);
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
}
