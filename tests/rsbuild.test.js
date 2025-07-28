import test from "node:test";
import path from "node:path";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { createRsbuild } from '@rsbuild/core';

test("builds and tree-shakes using rsbuild", async (t) => {
    await using dir = await fs.mkdtempDisposable('vite');

    const outDir = path.join(process.cwd(), dir.path, 'dist');

    let compiler = await createRsbuild({
        rsbuildConfig: {
            source: {
                entry: { index: './src/index.js' }
            },
            output: {
                filename: 'index.js',
                distPath: {
                    root: outDir,
                },
            },
            mode: 'production',
            logLevel: 'silent',
        }
    });

    const { stats } = await compiler.build();

    for (let asset of stats.toJson().assets) {
        const code = await fs.readFile(path.join(outDir, asset.name), 'utf8');
        if (asset.name.includes('js/index.')) {
            assert.match(code, /TO KEEP IN BUNDLE SYNC/) // ✅ Passes
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
        } else {
            assert.match(code, /TO KEEP IN BUNDLE ASYNC/) // ✅ Passes
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ❌ Throws
        }
    }
});
