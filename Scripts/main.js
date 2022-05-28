// I used the term 'Language Server' here accidentally. It's not
// a Language Server. Oops.

const { downloadLanguageServer } = require("./download.js");
const { sendMessage } = require("./messages.js");

exports.activate = async function() {
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
		let informationalNotificationRequest = new NotificationRequest()
		informationalNotificationRequest.title = "markdownlint Needs To Be Downloaded"
		informationalNotificationRequest.body = "Files while be linted in a moment."
		nova.notifications.add(informationalNotificationRequest)

		async function ensureLanguageServer () {
			try {
				await downloadLanguageServer();
			} catch (e) {
				let failureNotificationRequest = new NotificationRequest()
				failureNotificationRequest.title = "Download Failed"
				failureNotificationRequest.body =
					`Exit code: ${e}.${e == 127 ? " NPM might not be installed." : ""}`
				failureNotificationRequest.actions = [
					"Retry",
					"OK"
				]

				const { actionIdx: response } =
					await nova.notifications.add(failureNotificationRequest)

				if (response == 0) {
					return ensureLanguageServer()
				}

				throw new Error("Can't ensure the 'Language Server'!!!!")
			}
		}
		try {
			await ensureLanguageServer()
		} catch {
			// couldn't ensure the 'Language Server' which is not a Language Server :))
			return
		}

		let completionNotificationRequest = new NotificationRequest()
		completionNotificationRequest.title = "markdownlint Was Downloaded"
		completionNotificationRequest.body = "Markdown files will now be linted."
		nova.notifications.add(completionNotificationRequest)
	}

	nova.assistants.registerIssueAssistant("markdown", new IssuesProvider());
}

exports.deactivate = function() {
	// Clean up state before the extension is deactivated
}


class IssuesProvider {
	constructor() {
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
