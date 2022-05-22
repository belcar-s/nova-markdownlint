exports.sendMessage = (process, message) => {
	const stream = process.stdin
	const data = JSON.stringify({ ...message });
	const writer = stream.getWriter()

	writer.write(data + "\n")
	writer.releaseLock()

	return new Promise(resolve => {
		let disposable = process.onStdout(line => {
			const data = JSON.parse(line)
			// if (data.identifier == )
			disposable.dispose()
			resolve(data)
		})
	})
}
