import { toKeepInBundle as toKeepInBundleSync } from "./file-sync";
console.log(toKeepInBundleSync);

import(/* webpackChunkName: "file-async-module" */ "./file-async-module").then((module) => module.toKeepInBundle).then(console.log);

import(/* webpackChunkName: "file-async-picked" */ "./file-async-picked").then(({ toKeepInBundle }) => toKeepInBundle).then(console.log);

(async () => {
    const { toKeepInBundle: toKeepInBundleAwait } = await import(/* webpackChunkName: "file-async-await" */ "./file-async-await");
    console.log(toKeepInBundleAwait);
})()
