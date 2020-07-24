require('dotenv').config();

const { requireAuth } = require('../../lib/auth');

exports.handler = requireAuth(async (event, context) => {
  try {
    const { user } = context.identityContext;

    return {
      statusCode: 200,
      body: JSON.stringify({ user })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error_description: err.message })
    };
  }
});
