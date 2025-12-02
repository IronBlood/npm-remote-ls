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

ls({
	name: parsed.name,
	version: parsed.rawSpec,
	cfg: {
		verbose: argv.verbose,
		development: argv.development,
		peer: argv.peer,
		registry: argv.registry,
	},
});
