import test from "node:test";
import assert from "node:assert/strict";

import { rolldown } from 'rolldown';

test("builds and tree-shakes using rolldown", async (t) => {
    const bundle = await rolldown({
        input: 'src/index.js',
    });

    const result = await bundle.generate({});

    const builtIndex = result.output.find((output) => output.name === 'index');
    const builtFileAsyncAwait = result.output.find((output) => output.name === 'file-async-await');
    const builtFileAsyncModule = result.output.find((output) => output.name === 'file-async-module');
    const builtFileAsyncPicked = result.output.find((output) => output.name === 'file-async-picked');

    t.test("properly bundles important variables", () => {
        assert.match(builtIndex.code, /TO KEEP IN BUNDLE SYNC IMPORT/); // ✅ Passes
        assert.match(builtFileAsyncAwait.code, /TO KEEP IN BUNDLE TOP LEVEL AWAITED/); // ✅ Passes
        assert.match(builtFileAsyncModule.code, /TO KEEP IN BUNDLE ASYNC WHOLE MODULE/); // ✅ Passes
        assert.match(builtFileAsyncPicked.code, /TO KEEP IN BUNDLE ASYNC IMPORTED PICKED/); // ✅ Passes
    });

    t.test("tree shakes sync modules", () => {
        assert.doesNotMatch(builtIndex.code, /SHOULD BE REMOVED FROM BUNDLE SYNC IMPORT/); // ✅ Passes
    });

    t.test("tree shakes async modules top level awaited", () => {
        assert.doesNotMatch(builtFileAsyncAwait.code, /SHOULD BE REMOVED FROM BUNDLE TOP LEVEL AWAITED/); // ✅ Passes
    });

    t.test("tree shakes async modules import() whole module", () => {
        assert.doesNotMatch(builtFileAsyncModule.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC WHOLE MODULE/); // ✅ Passes
    });

    t.test("tree shakes async modules import() + picked", () => {
        assert.doesNotMatch(builtFileAsyncPicked.code, /SHOULD BE REMOVED FROM BUNDLE ASYNC IMPORTED PICKED/); // ✅ Passes
    });
});
