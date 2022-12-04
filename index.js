// sEcReT
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('node:crypto').webcrypto;

let DEBUG = false;

function log(...content) {
	if (DEBUG) {
		console.log(...content);
	}
}

const app = express()
const port = process.env.PORT || 5000

app.use(express.json());

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

const enc = new TextEncoder();
const dec = new TextDecoder();

const getFileName = async (password) => {
	let hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return 'data-' + hashHex + '.bin';
}

const getPasswordKey = (password) => {
	return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
}

const deriveKey = (passwordKey, salt, keyUsage) => {
	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 100000,
			hash: "SHA-256",
		},
		passwordKey,
		{ name: "AES-GCM", length: 256 },
		false,
		keyUsage
	);
}

async function encryptData(secretData, password) {
	try {
		const salt = crypto.getRandomValues(new Uint8Array(16));
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const passwordKey = await getPasswordKey(password);
		const aesKey = await deriveKey(passwordKey, salt, ["encrypt"]);
		const encryptedContent = await crypto.subtle.encrypt(
			{
				name: "AES-GCM",
				iv: iv,
			},
			aesKey,
			enc.encode(secretData)
		);

		const encryptedContentArr = new Uint8Array(encryptedContent);
		let buff = new Uint8Array(
			salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
		);
		buff.set(salt, 0);
		buff.set(iv, salt.byteLength);
		buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);
		return buff;
	} catch (e) {
		log(`Error - ${e}`);
		return null;
	}
}

async function decryptData(encryptedData, password) {
	try {
		const salt = encryptedData.slice(0, 16);
		const iv = encryptedData.slice(16, 16 + 12);
		const data = encryptedData.slice(16 + 12);
		const passwordKey = await getPasswordKey(password);
		const aesKey = await deriveKey(passwordKey, salt, ["decrypt"]);
		const decryptedContent = await crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv: iv,
			},
			aesKey,
			data
		);
		return dec.decode(decryptedContent);
	} catch (e) {
		log(`Error - ${e}`);
		return null;
	}
}

app.post('/send', async (req, res) => {
	const password = req.body.password;

	log('= SEND =');
	log('Password:', password);
	log('Data:', req.body.data)

	const data = JSON.stringify(req.body.data);
	
	const fileData = await encryptData(data, password);

	log('Buffer:', fileData.length);

	fs.writeFileSync(await getFileName(password), fileData);

	res.send('ok');
	res.end();
});

app.get('/receive/:password', async (req, res) => {
	const password = req.params.password;

	log('= RECEIVE =');
	log('Password:', password);

	let fileData = fs.readFileSync(await getFileName(password));

	log('Buffer:', fileData.length)

	const data = JSON.parse(await decryptData(fileData, password));

	log('Data:', data);

	res.json({
		data: data,
	});
	res.end();
})

app.get('/add', async (req, res) => {
	const password = req.query.password;

	log('= ADD =');
	log('Password:', password);
	log('URL:', req.query.url);

	const fileName = await getFileName(password);
	
	let fileData = fs.readFileSync(fileName);
	let data = JSON.parse(await decryptData(fileData, password));

	//
	data.bookmarks.push({
		url: req.query.url,
	})
	//

	const newData = JSON.stringify(data);
	const newFileData = await encryptData(newData, req.query.password);
	fs.writeFileSync(fileName, newFileData);

	res.send(`
<!DOCTYPE html>
<script>window.close();</script>
`);
	res.end();
})

app.listen(port, () => {
	log(`sEcReT app listening on port ${port}`)
})