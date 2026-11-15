"use strict";

/**
 * Runner for the rule-based suite under test/.
 * Prefer: node --test test/*.test.js
 */

var { spawnSync } = require("child_process");
var path = require("path");

var result = spawnSync(
  process.execPath,
  ["--test", path.join(__dirname, "test")],
  { stdio: "inherit" }
);
process.exit(result.status == null ? 1 : result.status);
