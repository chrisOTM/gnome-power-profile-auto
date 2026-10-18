// SPDX-License-Identifier: GPL-3.0-or-later
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const PROFILES = ['performance', 'balanced', 'power-saver'];
const LABELS = ['Performance', 'Balanced', 'Power Saver'];

function profileRow(settings, key, title, subtitle) {
    const row = new Adw.ComboRow({
        title,
        subtitle,
        model: Gtk.StringList.new(LABELS),
    });
    const sync = () => {
        row.selected = Math.max(0, PROFILES.indexOf(settings.get_string(key)));
    };
    sync();
    settings.connect(`changed::${key}`, sync);
    row.connect('notify::selected', () => {
        if (settings.get_string(key) !== PROFILES[row.selected])
            settings.set_string(key, PROFILES[row.selected]);
    });
    return row;
}

export default class PowerProfileAutoPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage({icon_name: 'power-profile-balanced-symbolic'});
        const group = new Adw.PreferencesGroup({
            title: 'Power Mode',
            description: 'Applied when the power source changes. A mode picked manually in ' +
                'Quick Settings stays until the next change.',
        });
        group.add(profileRow(settings, 'ac-profile', 'On AC Power', 'Charger connected'));
        group.add(profileRow(settings, 'battery-profile', 'On Battery', 'Charger disconnected'));
        page.add(group);
        window.add(page);
    }
}
