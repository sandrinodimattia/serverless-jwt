# @serverless-jwt/cloudflare

JWT authorization for Cloudflare Functions. Usage is easy:

```js
const { CloudflareJwtVerifier } = require('@serverless-jwt/cloudflare');

const verifyJwt = CloudflareJwtVerifier({
  issuer: 'https://sandrino.auth0.com/',
  audience: 'urn:my-api'
});

addEventListener('fetch', (event) => {
  event.respondWith(requireAuth(handleRequest)(event.request));
});

function handleRequest(identityContext, request) {
  return new Response(`hello world: ${JSON.stringify(identityContext.claims, null, 2)}`);
}
```

## Advanced Options

### Claims Mapping

You can also provide a function to map the incoming claims to a format that is more usable in your application. This would allow you to rename certain claims or to change the claim from a string to an array:

```js
const { CloudflareJwtVerifier, removeNamespaces, claimToArray } = require('@serverless-jwt/cloudflare');

const verifyJwt = CloudflareJwtVerifier({
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
