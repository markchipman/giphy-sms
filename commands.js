const gif = require('./gif.js');
const weather = require('./weather.js');

const noCommand = function (message) {
	return {
		text: 'Sorry, I don\'t know: ' + message.command.command,
		to: message.numbers.to,
		from: message.numbers.from
	}
};

const commandError = function (message) {
	return {
		text: 'Sorry, something went wrong',
		to: message.numbers.to,
		from: message.numbers.from
	}
}

module.exports = {
	gif: gif.handleGifCommand,
	weather: weather.handleWeatherCommand,
	error: commandError,
	default: noCommand
}
