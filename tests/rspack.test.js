import test from "node:test";
import path from "node:path";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { rspack } from '@rspack/core';

test("builds and tree-shakes using rspack", async (t) => {
    await using dir = await fs.mkdtempDisposable('vite');

    const outDir = path.join(process.cwd(), dir.path, 'dist')

    let compiler = rspack({
        entry: './src/index.js',
        output: {
            filename: 'index.js',
            path: outDir,
        },
        mode: 'production',
        module: {
            rules: [
                {
                    test: /\.js$/,
                    resolve: {
                        fullySpecified: false
                    }
                },
            ]
        }
    });

    const stats = await new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                console.error(err.stack || err);
                if (err.details) {
                    console.error(err.details);
                }
                reject(err);
                return;
            }

            const info = stats.toJson();

            if (stats.hasErrors()) {
                console.error(info.errors);
                reject(info.errors);
                return;
            }

            resolve(stats);
        });
    });

    for (let asset of stats.toJson().assets) {
        const code = await fs.readFile(path.join(outDir, asset.name), 'utf8');
        if (asset.name === 'index.js') {
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
        } else {
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ✅ Passes
        }
    }
});
