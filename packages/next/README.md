# @serverless-jwt/next

JWT authorization for Next.js API Routes. Usage is easy:

```js
import { NextJwtVerifier } from '@serverless-jwt/next';

const verifyJwt = NextJwtVerifier({
  issuer: 'https://sandrino.auth0.com/',
  audience: 'urn:my-api'
});

const apiRoute = async (req, res) => {
  const { claims } = context.identityContext;

  res.json({
    user: claims
  });
};

export default verifyJwt(apiRoute);
```

## Advanced Options

### Claims Mapping

You can also provide a function to map the incoming claims to a format that is more usable in your application. This would allow you to rename certain claims or to change the claim from a string to an array:

```js
import { NextJwtVerifier, removeNamespaces, claimToArray } from '@serverless-jwt/next';

const verifyJwt = NextJwtVerifier({
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
