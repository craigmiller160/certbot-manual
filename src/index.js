const spawn = require('cross-spawn');
const fs = require('fs');
const os = require('os');
const path = require('path');

// TODO how to guarantee root rights?

const DOMAIN = 'craigmiller160.ddns.net';
const ENTER_DOMAIN_PROMPT = /enter in your domain name/;
const CREATE_FILE_PROMPT = /Create a file containing just this data/;
const AUTHCODE_PATH = path.resolve(os.homedir(), 'authcode', 'authcode.txt');

const handleOutput = (shell, buffer) => {
	const text = buffer.toString();
	console.log(text);

	if (ENTER_DOMAIN_PROMPT.test(text)) {
		shell.stdin.write(`${DOMAIN}\n`);
	} else if (CREATE_FILE_PROMPT.test(text)) {
		const prefixIndex = text.indexOf(':');
		const promptMinusPrefix = text.substring(prefixIndex + 2);
		const suffixIndex = promptMinusPrefix.indexOf('And make it available');
		const promptMinusPrefixSuffix = promptMinusPrefix.substring(0, suffixIndex).trim();

		fs.writeFileSync(AUTHCODE_PATH, promptMinusPrefixSuffix);
	}
};

const shell = spawn('sudo', ['certbot', 'certonly', '--manual']);

shell.stdout.on('data', (data) => handleOutput(shell, data));
shell.stderr.on('data', (data) => handleOutput(shell, data));

shell.on('close', () => {
	console.log('Close');
});

shell.on('exit', () => {
	console.log('Exit');
})