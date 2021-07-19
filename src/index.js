const spawn = require('cross-spawn');
const fs = require('fs');
const os = require('os');
const path = require('path');

// TODO how to guarantee root rights?

const DOMAIN = 'craigmiller160.ddns.net';
const EMAIL = 'craigmiller160@gmail.com';
const AUTHCODE_PATH = path.resolve(os.homedir(), 'authcode', 'authcode.txt');
const YES = 'y';
const INGRESS_CERT_PATH = '/opt/kubernetes/data/ingress/cert';
const CERTBOT_CERT_PATH = `/etc/letsencrypt/live/${DOMAIN}`;

const ENTER_EMAIL_PROMPT = /Enter email address/;
const ENTER_DOMAIN_PROMPT = /enter in your domain name/;
const ENTER_DOMAIN_2_PROMPT = /enter the domain name/;
const CREATE_FILE_PROMPT = /Create a file containing just this data/;
const TERMS_OF_SERVICE_PROMPT = /Please read the Terms of Service/;

let challengeReady = false;

const sendInput = (shell, inputText) => {
	console.log(inputText);
	shell.sdtin.write(`${inputText}\n`);
};

const handleOutput = (shell, buffer) => {
	const text = buffer.toString();
	console.log(text);

	if (ENTER_DOMAIN_PROMPT.test(text) || ENTER_DOMAIN_2_PROMPT.test(text)) {
		sendInput(shell, DOMAIN);
	} else if (CREATE_FILE_PROMPT.test(text)) {
		const prefixIndex = text.indexOf(':');
		const promptMinusPrefix = text.substring(prefixIndex + 2);
		const suffixIndex = promptMinusPrefix.indexOf('And make it available');
		const promptMinusPrefixSuffix = promptMinusPrefix.substring(0, suffixIndex).trim();

		fs.writeFileSync(AUTHCODE_PATH, promptMinusPrefixSuffix);
		challengeReady = true;
		sendInput(shell, '');
	} else if (ENTER_EMAIL_PROMPT.test(text)) {
		sendInput(shell, EMAIL);
	} else if (TERMS_OF_SERVICE_PROMPT.test(text)) {
		sendInput(shell, YES);
	}
};

const shell = spawn('sudo', ['certbot', 'certonly', '--manual']);

shell.stdout.on('data', (data) => handleOutput(shell, data));
shell.stderr.on('data', (data) => handleOutput(shell, data));

shell.on('close', () => {
	console.log(`Copying cert files from ${CERTBOT_CERT_PATH} to ${INGRESS_CERT_PATH}`);
});