const { Plugin } = require('powercord/entities');

const remount = require('./commands/remount');
const watch = require('./commands/watch');

module.exports = class Remount extends Plugin {
	async startPlugin() {
		powercord.api.commands.registerCommand(
			remount.getCommand(this)
		);
		
		powercord.api.commands.registerCommand(
			watch.getCommand(this)
		);
		
		powercord.once('loaded', () => {watch.onLoaded(this)});
	}
  
	pluginWillUnload() {
		powercord.api.commands.unregisterCommand('watch');
		powercord.api.commands.unregisterCommand('remount');
	}
};
