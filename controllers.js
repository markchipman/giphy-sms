const commands = require('./commands.js');
const debug = require('debug')('giphy_sms');
const bandwidth = require('./bandwidth');

const buildToArray = function (message) {
	let numbers = {
		from: message.to
	}
	let toNumbers = message.message.to;
	let index = toNumbers.indexOf(message.to);
	if (index > -1 ) {
		toNumbers.splice(index, 1);
	}
	toNumbers.push(message.message.from);
	numbers.to = toNumbers;
	return numbers;
}

const isCommandValid = function (command) {
	// check to see if function as well
	return commands.hasOwnProperty(command);
};

const messageReadyForProcessing = function (message) {
	let isIncomingMessage = (message && message.message && message.message.direction == 'in');
	debug('Message is direction "in": %s', isIncomingMessage);
	if (isIncomingMessage) {
		debug(message);
		return message.message.text.toLowerCase().startsWith('@');
	}
	else {
		return false;
	}
};

const extractCommand = function (message) {
	let text = message.message.text.toLowerCase().substr(1);
	let command = text.split(' ')[0];
	let query = text.replace(command, '').trim();
	return { command: command, query: query};
};

module.exports.checkIfBodyIsArray = function (req, res, next) {
	debug('Checking if body is array ')
	if(Array.isArray(req.body)){
		debug('Req body is array');
		next();
	}
	else {
		var e = new Error('Message body not array');
		debug(e);
		next(e);
	}
};

module.exports.handleMessages = function (req, res, next) {
	req.outMessages = [];
	message = req.body[0];
	debug('Handling message');
	if (messageReadyForProcessing(message)) {
		message.numbers = buildToArray(message);
		message.command = extractCommand(message);
		const command = message.command.command
		if (isCommandValid(command)) {
			debug(message);
			commands[command](message)
			.then(function (outMessage) {
				req.outMessages.push(outMessage);
			})
			.catch(function (error) {
				debug(error);
				req.outMessages.push(commands.error(message));
			})
			.then(function () {
				next();
			});
		}
		else {
			req.outMessages.push(commands.default(message));
			next();
		}
	}
	else {
		var e = 'Message contents not valid';
		debug(e);
	}
};

module.exports.sendMessages = function (req, res, next) {
	bandwidth.sendGroup(req.outMessages[0])
	.then(function (body) {
		debug(body);
	});
};

