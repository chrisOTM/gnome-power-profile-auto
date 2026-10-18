// SPDX-License-Identifier: GPL-3.0-or-later
// Based on eliapasquali/power-profile-switcher.
import Gio from 'gi://Gio';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

// GNOME Shell does not ship these interface XMLs to extensions, so define the
// properties we use inline.
const UPowerIface = `<node>
<interface name="org.freedesktop.UPower">
  <property name="OnBattery" type="b" access="read"/>
</interface>
</node>`;

const PowerProfilesIface = `<node>
<interface name="org.freedesktop.UPower.PowerProfiles">
  <property name="ActiveProfile" type="s" access="readwrite"/>
  <property name="Profiles" type="aa{sv}" access="read"/>
</interface>
</node>`;

const UPowerProxy = Gio.DBusProxy.makeProxyWrapper(UPowerIface);
const PowerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(PowerProfilesIface);

// The profile is applied when the power source changes (and on enable or when
// the setting for the current source changes). A manual choice in Quick
// Settings is kept until the next change of power source.
export default class PowerProfileAuto extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._cancellable = new Gio.Cancellable();
        this._onBattery = null;

        this._settings.connectObject(
            'changed::ac-profile', () => this._onBattery === false && this._apply(),
            'changed::battery-profile', () => this._onBattery === true && this._apply(),
            this);

        this._profiles = new PowerProfilesProxy(Gio.DBus.system,
            'org.freedesktop.UPower.PowerProfiles', '/org/freedesktop/UPower/PowerProfiles',
            (proxy, error) => {
                if (error) {
                    console.error(`power-profile-auto: ${error.message}`);
                    return;
                }
                // power-profiles-daemon may start after the shell; apply once it appears.
                proxy.connectObject('notify::g-name-owner', () => this._apply(), this);
                this._apply();
            }, this._cancellable);

        this._upower = new UPowerProxy(Gio.DBus.system,
            'org.freedesktop.UPower', '/org/freedesktop/UPower',
            (proxy, error) => {
                if (error) {
                    console.error(`power-profile-auto: ${error.message}`);
                    return;
                }
                proxy.connectObject('g-properties-changed', () => this._syncPowerSource(), this);
                this._syncPowerSource();
            }, this._cancellable);
    }

    disable() {
        // Leave the current profile alone: disabling must not undo the user's mode.
        this._cancellable.cancel();
        this._settings.disconnectObject(this);
        this._upower?.disconnectObject(this);
        this._profiles?.disconnectObject(this);
        this._cancellable = null;
        this._settings = null;
        this._upower = null;
        this._profiles = null;
        this._onBattery = null;
    }

    _syncPowerSource() {
        const onBattery = this._upower.OnBattery;
        if (onBattery === null || onBattery === this._onBattery)
            return;
        this._onBattery = onBattery;
        this._apply();
    }

    _apply() {
        const proxy = this._profiles;
        if (this._onBattery === null || !proxy?.g_name_owner)
            return;

        const wanted = this._settings.get_string(this._onBattery ? 'battery-profile' : 'ac-profile');
        const available = (proxy.Profiles ?? []).map(p => p.Profile?.unpack());
        if (!available.includes(wanted)) {
            console.warn(`power-profile-auto: profile "${wanted}" not offered by the daemon`);
            return;
        }
        if (proxy.ActiveProfile !== wanted)
            proxy.ActiveProfile = wanted;
    }
}
