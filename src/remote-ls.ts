import registryUrl from "registry-url";
import semver from "semver";
import npa from "npm-package-arg";
import treeify from "treeify";

interface PackageVersion {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface PackageJson {
  _id: string;
  _rev: string;
  name: string;
  description: string;
  "dist-tags": Record<string, string>;
  versions: Record<string, PackageVersion>;
}

export interface RemoteLSCfg {
  registry?: string;
  verbose?: boolean;
  development?: boolean;
  peer?: boolean;
}

export enum DependantType {
  default,
  optional,
}

interface QueueNode {
  parent?: string;
  name: string;
  version: string;
  type: DependantType;
}

interface DependTreeNode {
  name: string;
  type: DependantType;
  children: DependTreeNode[];
}

export class RemoteLS {
  registry: string;
  /** include dev dependencies. */
  development: boolean;
  /** include peer dependencies. */
  peer: boolean;
  verbose: boolean;
  tree: DependTreeNode;
  flatMap: Map<string, DependTreeNode>;
  queue: QueueNode[];
  optionals: Set<string>;

  constructor(cfg: RemoteLSCfg = {}) {
    this.development = cfg.development ?? false;
    this.peer = cfg.peer ?? true;
    this.verbose = cfg.verbose ?? false;
    this.registry = cfg.registry || registryUrl();
    this.tree = {
      name: "TBD",
      type: DependantType.default,
      children: [],
    };
    this.flatMap = new Map();
    this.queue = [];
    this.optionals = new Set();
  }

  async _loadPackageJson(task: QueueNode): Promise<PackageJson | null> {
    const { name, version } = task;
    const couchPackageName = name && npa(name).escapedName;
    const url = `${this.registry.replace(/\/$/, "")}/${couchPackageName}`;

    let obj: PackageJson;
    try {
      const res = await fetch(url, {
        headers: {
          accept: "application/json",
        },
      });

      if (!res.ok) {
        const message = `status = ${res.status}`;
        console.log(`could not load ${name}${version} ${message}`);
        return null;
      }

      obj = await res.json() as PackageJson;
    } catch (err) {
      console.log(`could not load ${name}@${version} error = ${err.message}`);
      return null;
    }

    return obj;
  }

  /** @throws */
  _walkDependencies(task: QueueNode, packageJson: PackageJson): QueueNode[] {
    if (this.verbose) {
      console.log(`loading: ${task.name}@${task.version}`);
    }
    let version: string;
    try {
      version = this._guessVersion(task.version, packageJson);
    } catch (err) {
      throw err;
    }
    const entry = packageJson.versions?.[version] || {} as PackageVersion;

    const fullName = `${packageJson.name}@${version}`;
    if (this.flatMap.has(fullName)) {
      const x = this.flatMap.get(fullName);
      if (x.type === task.type || task.type === DependantType.optional) {
        // if same type or current type is optional, skip
        if (task.parent) {
          const parent = this.flatMap.get(task.parent);
          if (!parent) {
            throw new Error(`parent[${task.parent}] of ${fullName} should exist`);
          }
          parent.children.push(x);
        }
        return [];
      } else {
        // in this situation, the original x.type is optional, and should
        // be visited
        x.type = task.type;
      }
    }

    if (task.parent) {
      const parent = this.flatMap.get(task.parent);
      if (!parent) {
        throw new Error(`parent[${task.parent}] of ${fullName} should exist `);
      }
      const node: DependTreeNode = {
        name: fullName,
        type: task.type,
        children: [],
      };
      parent.children.push(node);
      this.flatMap.set(fullName, node);
    } else {
      this.tree.name = fullName;
      this.flatMap.set(fullName, this.tree);
    }

    if (task.type === DependantType.optional) {
      this.optionals.add(fullName);
      return [];
    }

    if (this.optionals.has(fullName)) {
      // if this dependency is required somewhere else, remove it from global
      // optionals
      this.optionals.delete(fullName);
    }

    const nextTasks: QueueNode[] = [];

    // dependencies is always included
    for (const [name, range] of Object.entries(entry.dependencies ?? {})) {
      nextTasks.push({
        name,
        version: range,
        type: DependantType.default,
        parent: fullName,
      });
    }

    // optional is included as well, but won't be visited
    for (const [name, range] of Object.entries(entry.optionalDependencies ?? {})) {
      nextTasks.push({
        name,
        version: range,
        type: DependantType.optional,
        parent: fullName
      });
    }

    if (this.development && !task.parent) {
      for (const [name, range] of Object.entries(entry.devDependencies ?? {})) {
        nextTasks.push({
          name,
          version: range,
          // only dev dependencies of the root package will be included as default
          type: DependantType.default,
          parent: fullName
        });
      }
    }

    // starting from npm v7, peer dependencies are always included, recursively
    if (this.peer) {
      for (const [name, range] of Object.entries(entry.peerDependencies ?? {})) {
        nextTasks.push({
          name,
          version: range,
          type: DependantType.default,
          parent: fullName
        });
      }
    }

    if (this.verbose) {
      console.log(`loaded: ${task.name}@${version}`);
    }
    return nextTasks;
  }

  /**
   * @throws
   */
  _guessVersion(versionString: string, packageJson: PackageJson) {
    if (versionString === "latest") {
      versionString = "*";
    }

    const availableVersions = Object.keys(packageJson.versions);
    let version = semver.maxSatisfying(availableVersions, versionString, true);
    if (!version && versionString === "*" && availableVersions.every(av => new semver.SemVer(av, true).prerelease.length)) {
      // just use latest then
      version = packageJson["dist-tags"]?.latest;
    }

    if (!version) {
      throw Error(`could not find a satisfactory version for string ${versionString}`);
    } else {
      return version;
    }
  }

  async ls(name: string, version: string) {
    this.queue.push({
      name,
      version,
      type: DependantType.default,
    });

    // BFS
    while (this.queue.length > 0) {
      const next_queue: QueueNode[] = [];

      await Promise.all(this.queue.map(async task => {
        const json = await this._loadPackageJson(task);
        if (json) {
          const next_tasks = this._walkDependencies(task, json);
          for (const x of next_tasks) {
            next_queue.push(x);
          }
        }
      }));

      this.queue = next_queue;
    }
  }

  _dump_tree() {
    const root = {};

    const dfs = (d: DependTreeNode, n: any) => {
      const name = d.type === DependantType.optional
        ? `(o) ${d.name}`
        : d.name;
      n = (n[name] = {});
      for (const c of d.children) {
        dfs(c, n);
      }
    };

    dfs(this.tree, root);

    console.log(treeify.asTree(root, false, false));
  }

  dump() {
    this._dump_tree();
  }
}
