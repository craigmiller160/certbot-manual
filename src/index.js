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
const CERT_FILENAME = 'fullchain.pem';
const KEY_FILENAME = 'privkey.pem';
const RENEW_AND_REPLACE = '2';

const ENTER_EMAIL_PROMPT = /Enter email address/;
const ENTER_DOMAIN_PROMPT = /enter in your domain name/;
const ENTER_DOMAIN_2_PROMPT = /enter the domain name/;
const CREATE_FILE_PROMPT = /Create a file containing just this data/;
const TERMS_OF_SERVICE_PROMPT = /Please read the Terms of Service/;
const EXISTING_CERT_PROMPT = /You have an existing certificate that has exactly the same domains/;

let challengeReady = false;

const sendInput = (shell, inputText) => {
	console.log(inputText);
	shell.stdin.write(`${inputText}\n`);
};

const moveFiles = () => {
	console.log(`Copying cert files from ${CERTBOT_CERT_PATH} to ${INGRESS_CERT_PATH}`);

	// TODO replace nodejs calls with cross-spawn shell calls including sudo to copy the files

	const certInputPath = path.resolve(CERTBOT_CERT_PATH, CERT_FILENAME);
	const keyInputPath = path.resolve(CERTBOT_CERT_PATH, KEY_FILENAME);
	if (!fs.existsSync(certInputPath)) {
		throw new Error(`Certificate does not exist at path ${certInputPath}`);
	}

	if (!fs.existsSync(keyInputPath)) {
		throw new Error(`Key does not exist at path ${keyInputPath}`);
	}

	const certOutputPath = path.resolve(INGRESS_CERT_PATH, CERT_FILENAME);
	const keyOutputPath = path.resolve(INGRESS_CERT_PATH, KEY_FILENAME);
	fs.renameSync(certInputPath, certOutputPath);
	fs.renameSync(keyInputPath, keyOutputPath);
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
	} else if (EXISTING_CERT_PROMPT.test(text)) {
		sendInput(shell, RENEW_AND_REPLACE);
	}
};

const shell = spawn('sudo', ['certbot', 'certonly', '--manual']);

shell.stdout.on('data', (data) => handleOutput(shell, data));
shell.stderr.on('data', (data) => handleOutput(shell, data));

shell.on('close', () => {
	moveFiles();
});