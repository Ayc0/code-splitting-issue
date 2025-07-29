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

    const builtIndex = result.outputFiles.find((outputFile) => outputFile.path.includes('index'))
    const builtFileAsync = result.outputFiles.find((outputFile) => outputFile.path.includes('file-async'))

    assert.match(builtIndex.text, /TO KEEP IN BUNDLE SYNC/) // ✅ Passes
    assert.match(builtFileAsync.text, /TO KEEP IN BUNDLE ASYNC/) // ✅ Passes

    assert.doesNotMatch(builtIndex.text, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
    assert.doesNotMatch(builtFileAsync.text, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ❌ Throws
});
