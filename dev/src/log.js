const output = document.querySelector('#output')
export const log = (message, values = null) => {
	output.value += `${message}`
	if (!!values) {
		output.value += `\n\t{`
		for (let z in values) {
			output.value += `\n\t\t${z}: '${values[z]}'`
		}
		output.value += `\n\t}`
	}
	output.value += `\n`
}
