module.exports = {
	getCommand(plugin) {
		this.plugin = plugin;
		return {
			command: 'remount',
			usage: '{c} [ plugin name ]',
			description: 'Remounts a plugin',
			executor: this.startRemount.bind(this),
			autocomplete: this.autocomplete.bind(this)
		}
	},
	
	startRemount([id]) {
		// Needs rewrite to catch errors
		const plugin = powercord.pluginManager.plugins.get(id);
		powercord.pluginManager.remount(id);
		this.toast(id, plugin.manifest.name);
		return false;
	},
	
	autocomplete([findId, ...args]) {
		if (args.length) {
			return false;
		}
		
		return {
			commands: [...powercord.pluginManager.plugins]
				.filter(([id]) => id.toLowerCase().includes(findId.toLowerCase()))
				.map(([id]) => ({ command: id })),
			header: 'plugins list'
		}
	},
	
	toast(id, name) {
		powercord.api.notices.sendToast('remountNotif', {
			header: 'Remount',
			content: `Successfully remounted "${name}"`,
			buttons: [
				{
					text: 'Dismiss',
					color: 'green',
					look: 'outlined',
					onClick: () => powercord.api.notices.closeToast('remountNotif'),
				},
			],
			timeout: 3e3,
		});
	}
}
