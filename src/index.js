import { toKeepInBundle as toKeepInBundleSync } from "./file-sync";
console.log(toKeepInBundleSync);

import("./file-async-module").then((module) => console.log(module.toKeepInBundle));

import("./file-async-picked").then(({ toKeepInBundle }) => console.log(toKeepInBundle));


const { toKeepInBundle: toKeepInBundleAwait } = await import("./file-async-await");
console.log(toKeepInBundleAwait);
