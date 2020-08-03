# @serverless-jwt/netlify

![http://npmjs.com/package/@serverless-jwt/netlify](https://img.shields.io/npm/l/@serverless-jwt/jwt-verifier) ![http://npmjs.com/package/@serverless-jwt/netlify](https://img.shields.io/npm/v/@serverless-jwt/jwt-verifier)

## Installation

```bash
npm install --save @serverless-jwt/netlify
```

## Using the library

JWT authorization for Netlify Functions. Usage is easy:

```js
const { NetlifyJwtVerifier } = require('@serverless-jwt/netlify');

const verifyJwt = NetlifyJwtVerifier({
  issuer: 'https://sandrino.auth0.com/',
  audience: 'urn:my-api'
});

const handler = async (event, context) => {
  // The user information is available here.
  const { claims } = context.identityContext;

  return {
    statusCode: 200,
    body: JSON.stringify({ profile: claims })
  };
};

exports.handler = verifyJwt(handler);
```

## Advanced Options

### Claims Mapping

You can also provide a function to map the incoming claims to a format that is more usable in your application. This would allow you to rename certain claims or to change the claim from a string to an array:

```js
const { NetlifyJwtVerifier, removeNamespaces, claimToArray } = require('@serverless-jwt/netlify');

const verifyJwt = NetlifyJwtVerifier({
  issuer: 'https://sandrino.auth0.com/',
  audience: 'urn:my-api',
  mapClaims: (claims) => {
    // Custom claims added in Auth0 have a prefix, which are removed here.
    const user = removeNamespaces('http://schemas.sandrino.dev/', claims);

    // Convert the scope and roles claims to arrays so they are easier to work with.
    user.scope = claimToArray(user.scope);
    user.roles = claimToArray(user.roles);
    return user;
  }
});
```
