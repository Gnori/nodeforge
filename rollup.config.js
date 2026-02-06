import { babel } from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import fs from 'fs';
import path from 'path';

// Plugin to convert CSS to lit-element format
const cssToLitElement = () => ({
  name: 'css-to-lit-element',
  writeBundle() {
    const cssPath = path.resolve('dist/nodeforge.min.css');
    const outputPath = path.resolve('dist/nodeforge.style.js');

    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf-8');
      const content = `import {css} from "lit-element"; export const style = css\`${css}\`;`;
      fs.writeFileSync(outputPath, content);
      console.log('Generated nodeforge.style.js');
    }
  }
});

export default [
  // JavaScript bundle
  {
    input: 'src/nodeforge.js',
    output: {
      file: 'dist/nodeforge.min.js',
      format: 'umd',
      name: 'NodeForge',
      exports: 'default',
      sourcemap: false,
      globals: {
        'lit-element': 'lit'
      }
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: ['@babel/preset-env']
      }),
      terser({
        ecma: 5,
        compress: {
          drop_console: false
        },
        output: {
          comments: false
        }
      })
    ]
  },
  // CSS bundle
  {
    input: 'src/nodeforge.css',
    output: {
      file: 'dist/nodeforge.bundle.js', // Temporary file
    },
    plugins: [
      postcss({
        extract: 'nodeforge.min.css',
        minimize: true,
        sourceMap: false
      }),
      cssToLitElement(),
      {
        name: 'cleanup-temp',
        writeBundle() {
          // Delete temporary JS file
          const tempFile = path.resolve('dist/nodeforge.bundle.js');
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        }
      }
    ]
  }
];
