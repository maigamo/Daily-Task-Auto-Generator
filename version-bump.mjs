import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.argv[2];
const minAppVersion = process.argv[3];

// read minAppVersion from manifest.json if it is not provided
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion: currentMinAppVersion } = manifest;
manifest.version = targetVersion;
if (minAppVersion) {
	manifest.minAppVersion = minAppVersion;
}
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update versions.json with target version and minAppVersion
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion || currentMinAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t")); 