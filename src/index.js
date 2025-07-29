import { toKeepInBundle as toKeepInBundleSyncImport } from "./file-sync-import";
console.log(toKeepInBundleSyncImport);

const { toKeepInBundle: toKeepInBundleSyncDestructuring } = require('./file-sync-require-destructuring')
console.log(toKeepInBundleSyncDestructuring);

const module = require('./file-sync-require-module')
console.log(module.toKeepInBundle);

const toKeepInBundleSyncChaining = require('./file-sync-require-chaining').toKeepInBundle
console.log(toKeepInBundleSyncChaining);

import(/* webpackChunkName: "file-async-module" */ "./file-async-module").then((module) => module.toKeepInBundle).then(console.log);

import(/* webpackChunkName: "file-async-picked" */ "./file-async-picked").then(({ toKeepInBundle }) => toKeepInBundle).then(console.log);

(async () => {
    const { toKeepInBundle: toKeepInBundleAwait } = await import(/* webpackChunkName: "file-async-await" */ "./file-async-await");
    console.log(toKeepInBundleAwait);
})()
