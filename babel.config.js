module.exports = {
  plugins: ['@babel/plugin-transform-async-to-generator'],
  presets: [
    [
      '@babel/preset-env',/*"@babel/preset-es2015",*/
      {
        targets: {
          node: 'current',
        },
        modules: 'cjs'
      },
    ],
  ],
}