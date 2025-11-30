import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import registryUrl from "registry-url";
import npa from "npm-package-arg";

import { ls } from "./index";

const argv = yargs(hideBin(process.argv))
	.usage("$0 <pkg-name> [options]")
	.options("name", {
		alias: "n",
		type: "string",
		description: "package name",
	})
	.options("pkg-version", {
		alias: "v",
		description: "package version",
		type: "string",
		default: "latest",
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
		default: true,
		boolean: true,
	})
	.options("optional", {
		alias: "o",
		description: "show optional dependencies",
		default: true,
		boolean: true,
	})
	.options("peer", {
		alias: "p",
		description: "show peer dependencies",
		default: false,
		boolean: true,
	})
	.options("registry", {
		alias: "r",
		description: "set an alternative registry url",
		default: registryUrl(),
	})
	.options("flatten", {
		alias: "f",
		description: "return flat representation of dependencies",
		default: false,
		boolean: true
	})
	.help()
	.alias("h", "help")
	.parseSync();

const parsed = npa(argv.name);

ls({
	name: parsed.name,
	version: parsed.rawSpec || argv["pkg-version"],
	flatten: argv.flatten,
	cfg: {
		verbose: argv.verbose,
		development: argv.development,
		optional: argv.optional,
		peer: argv.peer,
		registry: argv.registry,
	},
	cb: obj => {
		if (Array.isArray(obj)) {
			console.log("TODO");
		} else {
			console.log("TODO");
		}
	}
});
