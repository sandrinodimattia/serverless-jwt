module.exports = {
  plugins: [
    {
      resolve: 'gatsby-plugin-create-client-paths',
      options: { prefixes: ['/*'] }
    },
    `gatsby-plugin-postcss`
  ]
};
