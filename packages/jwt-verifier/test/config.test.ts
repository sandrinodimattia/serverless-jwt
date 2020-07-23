import { validateConfiguration } from '../src/config';

describe('#config', () => {
  it('should require a valid config object', async () => {
    const validate = () => {
      const config: any = null;
      validateConfiguration(config);
    };

    expect(validate).toThrow(`A valid configuration object must be provided`);
  });

  it('should require issuer', async () => {
    const validate = () =>
      validateConfiguration({
        issuer: '',
        audience: ''
      });

    expect(validate).toThrow(`Expected 'issuer' to be a valid string, got ''`);
  });

  it('should validate issuer format', async () => {
    expect(() => {
      const config: any = {
        issuer: 5,
        audience: ''
      };
      validateConfiguration(config);
    }).toThrow(`Expected 'issuer' to be string, got 'number'`);

    expect(() =>
      validateConfiguration({
        issuer: 'foo',
        audience: ''
      })
    ).toThrow(`Expected 'issuer' to be a valid http(s) uri, got 'foo'`);
  });

  it('should require audience', async () => {
    const validate = () =>
      validateConfiguration({
        issuer: 'https://acme',
        audience: ''
      });

    expect(validate).toThrow(`Expected 'audience' to be a valid string, got ''`);
  });

  it('should validate mapClaims', async () => {
    expect(() => {
      const config: any = {
        issuer: 'https://acme',
        audience: 'https://acme',
        mapClaims: 1
      };
      validateConfiguration(config);
    }).toThrow(`Expected 'mapClaims' to be a function, got 'number'`);
  });
});
