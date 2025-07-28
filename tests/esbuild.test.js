import test from "node:test";
import assert from "node:assert/strict";

import * as esbuild from 'esbuild';

test("builds and tree-shakes using esbuild", async (t) => {
    let result = await esbuild.build({
        entryPoints: ['src/index.js'],
        bundle: true,
        treeShaking: true,
        splitting: true,
        format: 'esm',
        outdir: '.',
        write: false,
    });

    for (let outputFile of result.outputFiles) {
        const code = outputFile.text;
        if (outputFile.path.endsWith('index.js')) {
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
        } else {
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ❌ Throws
        }
    }
});
