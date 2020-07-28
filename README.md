# Serverless JWT

With the rise of [JAMstack](https://jamstack.wtf/) we've seen a lot of frameworks and platforms offer the ability to build and host Serverless functions as lightweight backends for your applications.

In the last few years the Node.js ecosystem has provided many solutions to handle authentication in your web applications through libraries like [Passport.js](http://www.passportjs.org/) and [express-jwt](https://github.com/auth0/express-jwt/). But due to the different programming model of Serverless functions (lambdas as opposed to full blown web servers) these libraries are not the perfect tool for the job.

This is where `serverless-jwt` comes in: a simple and lightweight solution focused at solving authentication for your Serverless functions.

## How does this thing work?

### Pre-requisites

This library works well with applications which integrate with an OpenID Connect provider like Auth0, Azure AD (B2C), Identity Server, Okta, ... These applications will receive an `id_token` which is used to authenticated the user and an `access_token` used to talk to APIs (in our case to Serverless functions).

If you have such an application, read along! We'll be adding examples over time to show how you can do this with your favourite technology stack.

### Talking to Serverless functions

Your React/Vue/Angular/... code will be interacting with your Serverless functions using `fetch` or any other HTTP client. These calls will need to be made by providing the access token as part of the `Authorization` header:

```bash
Authorization: Bearer <access_token>
```

Here's an example:

```js
const callApi = async (path) => {
  try {
    setResponse('Loading...');

    const token = await getAccessTokenFromSomewhere();

    const api = await fetch('/.netlify/functions' + path, {
      headers: {
        authorization: 'Bearer ' + token
      }
    });

    const body = await api.json();
    setResponse({
      status: api.status,
      statusText: api.statusText,
      body
    });
  } catch (e) {
    setResponse(e.message);
  }
};
```

### Securing your Serverless functions

Finally, this is where `serverless-jwt` comes in. You'll want to secure your functions to make sure only authorized calls can execute the function.

You'll create a verifier in which you simply define the `issuer` (your OpenID Connect provider) and the `audience` (which identifies your own API). The library will use the discovery endpoints exposed by your OpenID Connect provider to load everything that is needed to validate incoming tokens.

If the request is authorized the Serverless function will be executed, otherwise an error will be returned to the client.

```js
import { NextJwtVerifier } from '@serverless-jwt/next';

const jwt = NextJwtVerifier({
  issuer: 'https://sandrino-dev.auth0.com/',
  audience: 'urn:worldmappers'
});

// Example Next.js API Route
const MyInvoices = async (req, res) => {
  // Claims contains the user's ID and any other information available about the user.
  const { claims } = req.identityContext;

  // Use the current user to filter data and apply other business logic.
  const invoices = db.invoices.get((i) => i.userId === claims.sub);
  res.json({
    invoices
  });
};

export default jwt(MyInvoices);
```

## Integrations

### Netlify Functions

[@serverless-jwt/netlify](./packages/netlify)

Examples:

- [Gatsby & Netlify Functions using Auth0](./examples/gatsby-auth0-netlify-functions)

### Next.js

[@serverless-jwt/next](./packages/next)

Examples:

- [Securing Next.js API Routes using Auth0](./examples/nextjs-auth0)

## OpenID Connect Providers

This library will work with any OpenID Connect Provider. Documentation for certain providers is available here:

- [Auth0](./docs/oidc-providers/auth0)
