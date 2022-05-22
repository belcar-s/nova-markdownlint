const { downloadLanguageServer } = require("./download.js");
const { sendMessage } = require("./messages.js");

exports.activate = function() {
	nova.assistants.registerIssueAssistant("markdown", new IssuesProvider());
}

exports.deactivate = function() {
	// Clean up state before the extension is deactivated
}


class IssuesProvider {
	constructor() {
		try {
			const markdownlintPath = nova.path.normalize(nova.path.join(
				__dirname,
				"..",
				"Markdownlint",
				"node_modules",
				"markdownlint"
			));
			nova.fs.listdir(markdownlintPath);
		} catch {
			console.log("Downloading…")
			downloadLanguageServer();
		}

		const serverPath = nova.path.normalize(
			nova.path.join(
				__dirname,
				"..",
				"Markdownlint",
				"server.mjs"
			)
		)
		const serverProcess = new Process("/usr/bin/env", {
			args: ["node", serverPath],
			stdio: "pipe"
		})
		serverProcess.onDidExit(status => console.log("exit" + status))
		serverProcess.onStderr(line => console.error(line))
		serverProcess.start()
		this.server = serverProcess
	}

	async provideIssues(editor) {
		function getDocumentText(document) {
			if (document.isEmpty) {
				return ""
			} else {
				return document.getTextInRange(new Range(0, document.length))
			}
		}

		let result = await sendMessage(this.server, {
			strings: {
				// document: "#hi"
				document: getDocumentText(editor.document)
			}
		})

		let issues = result.document.map(issue => {
			let novaIssue = new Issue()
			novaIssue.message = issue.ruleDescription
			novaIssue.line = issue.lineNumber
			novaIssue.endLine = issue.lineNumber
			novaIssue.code = issue.ruleNames[0]
			novaIssue.source = "markdownlint"
			novaIssue.severity = IssueSeverity.Warning

			if (issue.errorRange) {
				novaIssue.column = issue.errorRange[0]
				novaIssue.endColumn = issue.errorRange[1]
			}

			return novaIssue
		});

		return issues;
	}
}
