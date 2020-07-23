/* eslint-disable max-classes-per-file */

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class MetadataError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    Object.setPrototypeOf(this, MetadataError.prototype);

    this.code = code;
  }
}
