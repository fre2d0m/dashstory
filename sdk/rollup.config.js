import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // UMD build for browsers
  {
    input: 'src/index.js',
    output: {
      name: 'DashStory',
      file: 'dist/dashstory-sdk.umd.js',
      format: 'umd',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      production && terser()
    ]
  },
  // ESM build for modern bundlers
  {
    input: 'src/index.js',
    output: {
      file: 'dist/dashstory-sdk.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      production && terser()
    ]
  },
  // CommonJS build for Node
  {
    input: 'src/index.js',
    output: {
      file: 'dist/dashstory-sdk.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  }
];
