"use strict";

var fs = require("fs");
var path = require("path");
var Box3 = require("../calc.js");

var root = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(root, "data.json"), "utf8"));
var params = Box3.parseParams(data);

function euro(n) {
  return Math.round(n);
}

function near(actual, expected, tol, label) {
  var ok = Math.abs(actual - expected) <= tol;
  if (!ok) {
    throw new Error(
      (label || "near") + ": expected " + expected + " ± " + tol + ", got " + actual
    );
  }
}

module.exports = {
  Box3: Box3,
  data: data,
  params: params,
  euro: euro,
  near: near,
  VERIFIED_ON: "2026-11-15"
};
