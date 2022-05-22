#!/usr/bin/env node
// appendFile("/Users/belcar/Desktop/lorem.txt", "starting");
// import { appendFile } from "node:fs/promises";
import { createInterface } from "node:readline";

import markdownlintCallback from "markdownlint";
import { promisify } from "node:util";
const markdownlint = promisify(markdownlintCallback);

process.stdin.setEncoding("utf-8");
const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});
rl.on("line", async line => {
	// appendFile("/Users/belcar/Desktop/lorem.txt", line + "\n");
	const { strings } = JSON.parse(line);
	const issues = await markdownlint({ strings });
	console.log(JSON.stringify(issues));
})
