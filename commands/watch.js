const watch = require('node-watch'); // from powercord/package-lock.json

module.exports = {
	onLoaded(plugin) {
		this.plugin = plugin;
		this.watchers = {}
		plugin.settings.get('plugins', []).forEach((id) => this.startWatch(id));
	},
	
	getCommand(plugin) {
		this.plugin = plugin;
		return {
			command: 'watch',
			usage: '{c} [ add | remove | clear ] [ plugin name ]',
			description: 'Automatically remount a plugin when a change is detected',
			executor: this.runWatch.bind(this),
			autocomplete: this.autocomplete.bind(this)
		}
	},
	
	runWatch(args) {
		var action, id;
		if (args.length < 1) {
			return {
				send: false,
				result: 'You must specify a plugin to watch!'
			}
		} else if (args.length < 2) {
			action = 'add';
			id = args[0];
		} else {
			[action, id] = args;
		}
		
		action = action.toLowerCase();
		
		if (powercord.pluginManager.plugins.has(id)) {
			if (action == 'add') {
				if (this.plugin.settings.get('plugins', []).includes(id)) {
					return {
						send: false,
						result: `${args} is already being watched!`
					}
				}
				
				this.plugin.settings.set('plugins', [...this.plugin.settings.get('plugins', []), id]);
				return false;
			} else if (action == 'remove') {
				if (!(this.plugin.settings.get('plugins', []).includes(id))) {
					return {
						send: false,
						result: `${args} is not being watched!`
					}
				}
				
				this.plugin.settings.set('plugins', this.plugin.settings.get('plugins', []).filter(p => p != id));
				this.watchers[id].close();
				return {
					send: false,
					result: `Stopped watching ${args}!`
				}
			} else if (action == 'clear') {
				this.plugin.settings.set('plugins', []);
				this.watchers.filter(w => !(w.isClosed())).forEach(w => w.close());
				return {
					send: false,
					result: 'Cleared targets!'
				}
			} else {
				return {
					send: false,
					result: 'You must enter a valid action. [ add | remove | clear ]'
				}
			}
		}
		return {
			send: false,
			result: `Plugin not found. (${id})`
		}
	},
	
	startWatch(id) {
		const plugin = powercord.pluginManager.plugins.get(id);
		const watcher = watch(
			plugin.entityPath,
			{ recursive: true },
			global._.debounce(() => {
				powercord.pluginManager.remount(id);
			}, 350)
		);
		
		this.notice(id, plugin.manifest.name, () => {
			const plugins = this.settings.get('plugins', []);
			
			plugins.splice(plugins.indexOf(id), 1);
			this.settings.set('plugins', plugins);
			watcher.close();
		});
	},
	
	notice(id, name, onClick) {
		powercord.api.notices.sendAnnouncement(`remount-stop-${id}`, {
			message: `Watching the plugin "${name}"`,
			button: {
				text: 'stop',
				onClick,
			},
		});
	},
	
	autocomplete(args) {
		if (args.length < 2) {
			return {
				commands: ['add', 'remove', 'clear']
					.filter(([sub]) => sub.includes(args[0].toLowerCase()))
					.map(([sub]) => ({ command: sub })),
				header: 'subcommands'
			}
		} else if (args.length < 3) {
			if (args[0].toLowerCase() == 'add' || args[0].toLowerCase() == 'remove') {
				return {
					commands: [...powercord.pluginManager.plugins]
						.filter(([id]) => id.toLowerCase().includes(args[1].toLowerCase()))
						.map(([id]) => ({ command: id })),
					header: 'plugins list'
				}
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
}
