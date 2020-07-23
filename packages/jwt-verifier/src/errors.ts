/* eslint-disable max-classes-per-file */

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class JwtVerifierError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    Object.setPrototypeOf(this, JwtVerifierError.prototype);

    this.code = code;
  }
}
