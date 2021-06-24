const { Plugin } = require('powercord/entities');
const watch = require('node-watch'); // from powercord/package-lock.json

module.exports = class Remount extends Plugin {
  async startPlugin() {
    powercord.api.commands.registerCommand({
      command: 'remount',
      usage: '{c} [plugin name]',
      description: 'remount a plugin',
      executor: this.startRemount.bind(this),
      autocomplete: this.autocomplete.bind(this),
    });
    powercord.api.commands.registerCommand({
      command: 'watch',
      usage: '{c} [plugin name]',
      description: 'track changes in a plugin and automatically remount it',
      executor: this.runWatch.bind(this),
      autocomplete: this.autocomplete.bind(this),
    });
    powercord.once('loaded', this.onLoaded.bind(this));
  }

  pluginWillUnload() {
    powercord.api.commands.unregisterCommand('watch');
    powercord.api.commands.unregisterCommand('remount');
  }

  onLoaded() {
    this.settings.get('plugins', []).forEach((id) => this.startWatch(id));
  }

  runWatch([id]) {
    if (powercord.pluginManager.plugins.has(id)) {
      if (this.settings.get('plugins', []).includes(id)) {
        return { result: 'already watching' };
      }
      this.settings.set('plugins', [...this.settings.get('plugins', []), id]);
      this.startWatch(id);
      return false;
    }
    return { result: 'plugin not found' };
  }

  startRemount([id]) {
    if (powercord.pluginManager.plugins.has(id)) {
      const plugin = powercord.pluginManager.plugins.get(id);
      powercord.pluginManager.remount(id);
      this.toast(id, plugin.manifest.name);
      return false;
    }
    return { result: 'plugin not found' };
  }

  autocomplete([findId, ...args]) {
    if (args.length) {
      return;
    }
    return {
      commands: [...powercord.pluginManager.plugins]
        .filter(([id]) => id.includes(findId))
        .map(([id]) => ({ command: id })),
      header: 'plugins list',
    };
  }

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
  }

  notice(id, name, onClick) {
    powercord.api.notices.sendAnnouncement(`remount-stop-${id}`, {
      message: `watching the plugin "${name}"`,
      button: {
        text: 'stop',
        onClick,
      },
    });
  }

  toast(id, name) {
    powercord.api.notices.sendToast('remountNotif', {
      header: 'remount',
      content: `successfully remounted "${name}"`,
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
};
