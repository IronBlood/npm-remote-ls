import { readFileSync } from "node:fs";
import { describe, it, expect } from "@jest/globals";

import {
  DependantType,
  RemoteLS,
  type PackageJson,
} from "../src/remote-ls";

describe("RemoteLS", () => {
  describe("guessVersion", () => {
    const packageJson = JSON.parse(
      readFileSync("./test/fixtures/nopt.json", "utf8")
    ) as PackageJson;
    const ls = new RemoteLS();

    it("should handle an exact version being provided", () => {
      expect(ls._guessVersion("1.0.0", packageJson)).toBe("1.0.0");
    });

    it("should handle a complex version being provided", () => {
      expect(ls._guessVersion("*", packageJson)).toBe("3.0.1");
    });

    it("should raise an exception if version cannot be found", () => {
      expect(() => ls._guessVersion("9.0.0", packageJson)).toThrow();
    });

    it("should handle \"latest\" being provided as version", () => {
      expect(ls._guessVersion("latest", packageJson)).toBe("3.0.1");
    });

    it("should return dist-tags.latest when * wanted and package has only prerelease versions", () => {
      const packageJson = JSON.parse(readFileSync("./test/fixtures/angular-core.json", "utf8")) as PackageJson;
      expect(ls._guessVersion("*", packageJson)).toBe("2.0.0-rc.3");
    });
  });

  describe("_walkDependencies", () => {
    it("should push appropriate dependencies to queue", () => {
      const packageJson = JSON.parse(
        readFileSync("./test/fixtures/nopt.json", "utf8")
      ) as PackageJson;
      const ls = new RemoteLS();
      const next_queue = ls._walkDependencies({
        name: "nopt",
        version: "1.0.6",
        type: DependantType.default,
      }, packageJson);

      expect(next_queue.length).toBe(1);
      const d = next_queue[0];
      expect(d).toStrictEqual({
        name: "abbrev",
        version: "1",
        parent: "nopt@1.0.6",
        type: DependantType.default,
      });
    });

    it("should push devDependencies to queue", () => {
      const packageJson = JSON.parse(
        readFileSync("./test/fixtures/nopt.json", "utf8")
      ) as PackageJson;
      const ls = new RemoteLS({
        development: true,
      });
      const next_queue = ls._walkDependencies({
        name: "nopt",
        version: "1.0.8",
        type: DependantType.default,
      }, packageJson);

      expect(next_queue.length).toBe(1);
      expect(next_queue[0]).toStrictEqual({
        name: "tap",
        version: "1.0.0",
        parent: "nopt@1.0.8",
        type: DependantType.default,
      });
    });

    it("should not raise an exception if package has no dependencies", () => {
      const packageJson = JSON.parse(
        readFileSync("./test/fixtures/abbrev.json", "utf8")
      ) as PackageJson;
      var ls = new RemoteLS()
      expect(() => ls._walkDependencies({
        name: "abbrev",
        version: "*",
        type: DependantType.default,
      }, packageJson)).not.toThrow();
    });

    it("should not walk dependency if dependency has already been observed", () => {
      const packageJson = JSON.parse(
        readFileSync("./test/fixtures/nopt.json", "utf8")
      ) as PackageJson;
      var ls = new RemoteLS()

      let next_queue = ls._walkDependencies({
        name: "nopt",
        version: "1.0.0",
        type: DependantType.default,
      }, packageJson);
      expect(next_queue.length).toBe(2);

      // walk the same version again
      next_queue = ls._walkDependencies({
        name: "nopt",
        version: "1.0.0",
        type: DependantType.default,
      }, packageJson);
      expect(next_queue.length).toBe(0);
    });

    it("should push peerDependencies to queue", () => {
      const packageJson = JSON.parse(
        readFileSync("./test/fixtures/angular-core.json", "utf8")
      ) as PackageJson;
      var ls = new RemoteLS({
        peer: true,
      })

      const next_queue = ls._walkDependencies({
        name: "@angular/core",
        version: "2.0.0-rc.3",
        type: DependantType.default
      }, packageJson);

      expect(next_queue.length).toBe(1);
      expect(next_queue[0]).toStrictEqual({
        name: "rxjs",
        version: "5.0.0-beta.6",
        type: DependantType.default,
        parent: "@angular/core@2.0.0-rc.3",
      });
    });
  });
});
