function startProcess(location, args, cwd) {
	const options = {
		args,
		cwd
	};
	console.log(location, args.join(" "));
	const process = new Process(location, options);
	process.onStdout(line => console.log(line));

	const onExit = new Promise((resolve, reject) => {
		process.onDidExit(status => {
			console.log(`Exited ${location} with code ${status}`);
			const action = status == 0 ? resolve : reject;
			action(status);
		});
	});

	process.start();
	return onExit;
}

exports.downloadLanguageServer = () => {
	const serverDir = nova.path.normalize(nova.path.join(__dirname, "..", "Markdownlint"));
	return startProcess("/usr/bin/env", ["npm", "install", "--production"], serverDir);
}
