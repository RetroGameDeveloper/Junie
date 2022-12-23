import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import glob from 'glob';

import nodeResolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import commonjs from '@rollup/plugin-commonjs'
import styles from 'rollup-plugin-styles'
import copy from 'rollup-plugin-copy'
import { terser } from 'rollup-plugin-terser'

const build = process.env.BUILD || 'development';
const version = process.env.VERSION || Date.now();

function watcher(globs) {
    return {
        buildStart() {
            for (const item of globs) {
                const files = glob.sync(path.resolve(__dirname, item));

                for (let file of files)
                    this.addWatchFile(file)
            }
        },
    }
};

function html(outdir, html, sw) {
    return {
        name: 'html',
        writeBundle(_, bundle) {
			let code = bundle[Object.keys(bundle)[0]].code;
			code = Buffer.from(code).toString('base64');

			let code_html = readFileSync(html, 'utf-8');
			let code_sw = readFileSync(sw, 'utf-8');

			code_html = code_html.replace(
				'window.junie_build = null;',
				`window.junie_build = '${version}';`
			);
			code_html = code_html.replace(
				'const source = null;',
				`const source = '${code}';`
			);

			code_sw = `// ${version}\n${code_sw}`;

			writeFileSync(`${outdir}/${html}`, code_html);
			writeFileSync(`${outdir}/${sw}`, code_sw);
        }
    };
}

export default {
    input: 'src/index.jsx',
    output: {
        file: 'build/index.js',
        format: 'es'
    },
    inlineDynamicImports: true,
    preserveEntrySignatures: false,
    plugins: [
        watcher([
            'index.html',
            'src/**',
            'res/**',
            '../app/GNUmakefile*',
            '../app/src/*.c',
            '../app/src/*.h',
            '../app/res/**',
            '../app/web/**'
        ]),
        nodeResolve({
			preferBuiltins: true,
            rootDir: path.join(process.cwd(), 'src'),
            extensions: ['.js', '.jsx'],
        }),
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify(build)
        }),
        styles(),
        url({ limit: 256 * 1024 }),
        commonjs(),
        babel({
            compact: false,
            babelHelpers: 'bundled',
            presets: [['@babel/preset-react', { runtime: 'automatic' }]],
        }),
        (build == 'production') && terser(),
        html('build', 'index.html', 'service-worker.js'),
		copy({
			hook: 'buildStart',
			targets: [
				{ src: 'manifest.json', dest: 'build' },
				{ src: 'icons/*', dest: 'build/icons' },
				{ src: '../app/build/*', dest: 'build/cores' }
			]
		}),
    ]
};
