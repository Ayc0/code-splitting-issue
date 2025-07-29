import { toKeepInBundle as toKeepInBundleSync } from "./file-sync";
console.log(toKeepInBundleSync);

import(/* webpackChunkName: "file-async-module" */ "./file-async-module").then((module) => console.log(module.toKeepInBundle));

import(/* webpackChunkName: "file-async-picked" */ "./file-async-picked").then(({ toKeepInBundle }) => console.log(toKeepInBundle));

(async () => {
    const { toKeepInBundle: toKeepInBundleAwait } = await import(/* webpackChunkName: "file-async-await" */ "./file-async-await");
    console.log(toKeepInBundleAwait);
})()
