export default [
  // ESM bundle (tree-shakeable, for bundlers + modern browsers)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/macro-engine.esm.js',
      format: 'es',
      sourcemap: true,
    },
  },
  // UMD bundle (script tag, legacy environments)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/macro-engine.umd.js',
      format: 'umd',
      name: 'MacroEngine',
      sourcemap: true,
    },
  },
];
