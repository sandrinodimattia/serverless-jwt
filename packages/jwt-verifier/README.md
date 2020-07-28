# @serverless-jwt/jwt-verifier

The base module for the `serverless-jwt` ecosystem which is platform independent and can be used to build provider specific integrations or which can be used straight out of the box.

## Installation

```bash
npm install --save @serverless-jwt/jwt-verifier
```

## Usage

The verifier can be configured to validate tokens from a given `issuer` to a given `audience`.

```js
const { JwtVerifier, JwtVerifierError } = require('@serverless-jwt/jwt-verifier');

const jwt = new JwtVerifier({
  issuer: 'https://auth.sandrino.dev/',
  audience: 'urn:colors-api'
});

try {
  const claims = await jwt.verifyAccessToken(token);
  ...
} catch (e) {
   if (e instanceof JwtVerifierError) {
      console.error(e.code, e.message);
    }
}
```

## Advanced Options

### Claims Mapping

You can also provide a function to map the incoming claims to a format that is more usable in your application. This would allow you to rename certain claims or to change the claim from a string to an array:

```js
const { JwtVerifier, removeNamespaces, claimToArray } = require('@serverless-jwt/jwt-verifier');

const jwt = new JwtVerifier({
  issuer: 'https://auth.sandrino.dev/',
  audience: 'urn:colors-api',
  mapClaims: (claims) => {
    let user = {
      ...claims
    };

    // Helper to remove namespaces from each claim (eg: http://schemas.acme.com/roles would be transformed into simply roles)
    user = removeNamespaces(user);

    // Use a helper to transform a string into an array.
    user.scopes = claimToArray(user.scopes);
  }
});
```

### Extract Token

If a token was provided through the Authorization header, a small helper is available to extract the token from the header:

```js
const { getTokenFromHeader } = require('@serverless-jwt/jwt-verifier');
const token = getTokenFromHeader(request.headers.get('Authorization'));
```
