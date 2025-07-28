import test from "node:test";
import path from "node:path";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { build } from "vite";

test("builds and tree-shakes using vite", async (t) => {
    await using dir = await fs.mkdtempDisposable('vite');

    const result = await build({
        configFile: false,
        root: 'src',
        logLevel: 'silent',
        build: {
            outDir: path.join(process.cwd(), dir.path, 'dist'),
        },
    });


    const builtIndex = result.output.find((r) => r.name === 'index')
    const builtFileAsync = result.output.find((r) => r.name === 'file-async')

    assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC/) // ✅ Passes
    assert.match(builtFileAsync.code, /TO KEEP IN BUNDLE ASYNC/) // ✅ Passes

    assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
    assert.doesNotMatch(builtFileAsync.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ❌ Throws
});
