import {
	RemoteLSCfg,
	RemoteLS,
} from "./remote-ls";

interface LsOpts {
	name: string;
	cfg: RemoteLSCfg;
	version: string;
}

export async function ls(opts: LsOpts) {
	const ls = new RemoteLS(opts.cfg);

	await ls.ls(opts.name, opts.version);

	ls.dump();
}
