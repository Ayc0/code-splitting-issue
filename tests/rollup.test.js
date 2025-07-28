import test from "node:test";
import assert from "node:assert/strict";

import { rollup } from 'rollup';

test("builds and tree-shakes using rollup", async (t) => {
    const bundle = await rollup({
        input: 'src/index.js',
    });

    const result = await bundle.generate({})

    for (let output of result.output) {
        const code = output.code;
        if (output.name === 'index') {
            assert.match(code, /TO KEEP IN BUNDLE SYNC/) // ✅ Passes
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
        } else {
            assert.match(code, /TO KEEP IN BUNDLE ASYNC/) // ✅ Passes
            assert.doesNotMatch(code, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ❌ Throws
        }
    }
});
