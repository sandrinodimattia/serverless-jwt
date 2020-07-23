import MetadataClient from '../src/metadata';
import { MetadataError } from '../src/errors';
import {
  openidConfiguration,
  openidConfigurationSlow,
  openidConfigurationFailure,
  openidConfigurationNetworkFailure,
  jwksSlow,
  jwksFailure,
  jwksNetworkFailure
} from './helpers/oidc';

jest.setTimeout(15000);

describe('#jwks', () => {
  describe('#getOpenIdConfiguration', () => {
    const issuer = 'https://auth.local';

    it('should handle network errors', () => {
      expect.assertions(3);

      const metadata = new MetadataClient(issuer);
      openidConfigurationNetworkFailure(issuer);

      return metadata.getOpenIdConfiguration().catch((e) => {
        expect(e).toBeInstanceOf(MetadataError);
        expect(e.code).toMatch('network_error');
        expect(e.message).toMatch(`Failed to fetch '${issuer}/.well-known/openid-configuration': ENOTFOUND`);
      });
    });

    it('should handle errors', () => {
      expect.assertions(3);

      const metadata = new MetadataClient(issuer);
      openidConfigurationFailure(issuer);

      return metadata.getOpenIdConfiguration().catch((e) => {
        expect(e).toBeInstanceOf(MetadataError);
        expect(e.code).toMatch('http_error');
        expect(e.message).toMatch(
          `Failed to fetch '${issuer}/.well-known/openid-configuration': 429 Too Many Requests`
        );
      });
    });

    it('should handle timeouts', () => {
      expect.assertions(3);

      const metadata = new MetadataClient(issuer);
      openidConfigurationSlow(issuer, 11000);

      const request = metadata.getOpenIdConfiguration();

      return request.catch((e) => {
        jest.clearAllTimers();
        expect(e).toBeInstanceOf(MetadataError);
        expect(e.code).toMatch('timeout_error');
        expect(e.message).toMatch(`Failed to fetch '${issuer}/.well-known/openid-configuration': Request timed out`);
      });
    });

    it('should load configuration', async () => {
      expect.assertions(1);

      const metadata = new MetadataClient(issuer);
      openidConfiguration(issuer);

      const config = await metadata.getOpenIdConfiguration();
      expect(config.issuer).toEqual(`${issuer}/`);
    });
  });

  describe('#getJsonWebKeySet', () => {
    const issuer = 'https://auth.local';

    beforeEach(() => {
      openidConfiguration(issuer);
    });

    it('should handle network errors', () => {
      expect.assertions(3);

      const metadata = new MetadataClient(issuer);
      jwksNetworkFailure(issuer);

      return metadata.getJsonWebKeySet().catch((e) => {
        expect(e).toBeInstanceOf(MetadataError);
        expect(e.code).toMatch('network_error');
        expect(e.message).toMatch(`Failed to fetch '${issuer}/.well-known/jwks.json': ENOTFOUND`);
      });
    });

    it('should handle errors', () => {
      expect.assertions(3);

      const metadata = new MetadataClient(issuer);
      jwksFailure(issuer);

      return metadata.getJsonWebKeySet().catch((e) => {
        expect(e).toBeInstanceOf(MetadataError);
        expect(e.code).toMatch('http_error');
        expect(e.message).toMatch(`Failed to fetch '${issuer}/.well-known/jwks.json': 429 Too Many Requests`);
      });
    });

    it('should handle timeouts', () => {
      expect.assertions(3);

      const metadata = new MetadataClient(issuer, `${issuer}/.well-known/jwks.json`);
      jwksSlow(issuer, 11000);

      const request = metadata.getJsonWebKeySet();
      return request.catch((e) => {
        expect(e).toBeInstanceOf(MetadataError);
        expect(e.code).toMatch('timeout_error');
        expect(e.message).toMatch(`Failed to fetch '${issuer}/.well-known/jwks.json': Request timed out`);
      });
    });

    it('should load keys', async () => {
      expect.assertions(1);

      const metadata = new MetadataClient(issuer);

      const keys = await metadata.getJsonWebKeySet();
      expect(keys).toHaveLength(2);
    });
  });
});
