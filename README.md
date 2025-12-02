# npm-remote-ls

[![CI](https://github.com/IronBlood/npm-remote-ls/actions/workflows/ci.yml/badge.svg)](https://github.com/IronBlood/npm-remote-ls/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@ironblood/npm-remote-ls.svg)](https://www.npmjs.com/package/@ironblood/npm-remote-ls)

Examine a package's dependency graph before you install it.

## Installation

```bash
npm install @ironblood/npm-remote-ls -g
```

## Usage

### Listing Package Dependencies

```
$ npm-remote-ls -n sha@1.2.4
sha@1.2.4
├─ graceful-fs@3.0.12
│  └─ natives@1.1.6
└─ readable-stream@1.0.34
   ├─ inherits@2.0.4
   ├─ isarray@0.0.1
   ├─ string_decoder@0.10.31
   └─ core-util-is@1.0.3
```

- When optional dependencies are present, they’re listed separately so you can see which deps are optional. By default they aren’t traversed; rerun the CLI with any optional package you want to inspect in detail.
- Peer dependencies are traversed by default, development dependencies are ignored.

### Help!

There are various command line flags you can toggle for `npm-remote-ls`, for
details run:

```bash
npm-remote-ls --help
```

## License

ISC
