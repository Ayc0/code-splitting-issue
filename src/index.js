import { toKeepInBundle as toKeepInBundleSync } from "./file-sync";

console.log(toKeepInBundleSync);

import("./file-async").then((module) => console.log(module.toKeepInBundle));
