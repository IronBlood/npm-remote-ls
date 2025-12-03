#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import registryUrl from "registry-url";
import npa from "npm-package-arg";

import { ls } from "./index.js";

const argv = yargs(hideBin(process.argv))
	.usage("$0 <pkg-name> [options]")
	.options("name", {
		alias: "n",
		type: "string",
		description: "package name",
	})
	.options("verbose", {
		alias: "e",
		type: "boolean",
		default: false,
		description: "enable verbose logging",
	})
	.options("development", {
		alias: "d",
		description: "show development dependencies",
		default: false,
		boolean: true,
	})
	.options("peer", {
		alias: "p",
		description: "show peer dependencies",
		default: true,
		boolean: true,
	})
	.options("registry", {
		alias: "r",
		description: "set an alternative registry url",
		default: registryUrl(),
	})
	.help()
	.alias("h", "help")
	.parseSync();

const parsed = npa(argv.name);
const target = parsed.type === "alias"
	? (parsed as npa.AliasResult).subSpec
	: parsed;
const name = target?.name ?? parsed.name ?? argv.name;
const version = target?.rawSpec ?? parsed.rawSpec;

ls({
	name,
	version,
	cfg: {
		verbose: argv.verbose,
		development: argv.development,
		peer: argv.peer,
		registry: argv.registry,
	},
});
