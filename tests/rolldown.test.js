import test from "node:test";
import assert from "node:assert/strict";

import { rolldown } from 'rolldown';

test("builds and tree-shakes using rolldown", async (t) => {
    const bundle = await rolldown({
        input: 'src/index.js',
    });

    const result = await bundle.generate({})

    const builtIndex = result.output.find((output) => output.name === 'index')
    const builtFileAsync = result.output.find((output) => output.name === 'file-async')

    assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC/) // ✅ Passes
    assert.match(builtFileAsync.code, /TO KEEP IN BUNDLE ASYNC/) // ✅ Passes

    assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC/) // ✅ Passes
    assert.doesNotMatch(builtFileAsync.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC/) // ✅ Passes
});
