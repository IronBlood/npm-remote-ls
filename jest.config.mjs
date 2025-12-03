/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	transform: {
		"^.+\\.ts$": ["ts-jest", {
			useESM: true,
			tsconfig: "./tsconfig.json",
			diagnostics: false,
		}],
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
};
