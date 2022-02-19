module.exports = {
  // add this section
  purge: [
    './src/**/*.html',
    './src/**/*.svelte'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    colors: {
      'brown': '#232125',
      'brown-light': '#332f35',
    },
    backgroundColor: (theme) => theme('colors'),
    textColor: (theme) => theme('colors'),
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
