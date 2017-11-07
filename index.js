#!/usr/bin/env node
var os = require('os');
var yaml = require('js-yaml');
var diff = require('deep-object-diff');
var colors = require('colors');

var stdin = process.openStdin();

var printMessage = (color) => (msg) => {
	console.log("\t\t" + msg[color]);
}

stdin.on('data', function(chunk) {
	const rows = chunk.toString().split(os.EOL);
	let found;
	rows.forEach(row => {
		found = row.match(/(docker_compose|rancher_compose):( )+\"(.*)\" => \"(.*)\"$/)
		if (found) {
			console.log("\t" + found[1].trim().yellow);
			const origin = yaml.safeLoad(found[3].replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n"));
			const newValue = yaml.safeLoad(found[4].replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n"));

			describe(
				origin,
				diff.addedDiff(origin, newValue)
			).forEach(printMessage("green"));
			describe(
				origin,
				diff.deletedDiff(origin, newValue)
			).forEach(printMessage("red"));
			describe(
				origin,
				diff.updatedDiff(origin, newValue)
			).forEach(printMessage("yellow"));
		} else {
			console.log(row.trim());
		}
	});
});

function describe(origin, diff) {
	var description = [];
	var describeOne = (path, origin, value) => {
		if (typeof value == 'object') {
			Object.keys(value).forEach(key => {
				const or = typeof origin != "undefined" ? origin[key] : undefined;
				if (isNaN(parseInt(key, 10))) {
					describeOne(path + "." + key, or, value[key]);
				} else {
					describeOne(path + "[" + key + "]", or, value[key]);
				}
			})
		} else if (typeof value == "undefined") {
			description.push(path + ": \"" + origin + "\" => undefined")
		} else {
			description.push(path + ": \"" + origin + "\" => \"" +  value + "\"");
		}
	}
	describeOne("", origin, diff);
	return description;
}
