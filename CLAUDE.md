# gnome-power-profile-auto

GNOME Shell extension that sets the power mode (power-profiles-daemon profile) when the power
source changes: one profile for AC, one for battery. Rewrite based on
eliapasquali/power-profile-switcher, therefore GPL-3.0 (not MIT).

- `extension/extension.js`: watches `OnBattery` on `org.freedesktop.UPower` and writes
  `ActiveProfile` on `org.freedesktop.UPower.PowerProfiles`. Interface XML is inline because the
  shell does not expose its D-Bus interface files to extensions.
- Behaviour: apply on power-source change, on enable and when the setting for the current source
  changes; never on battery-percentage updates and never on disable, so a manual choice in Quick
  Settings survives until the next plug/unplug. `session-modes` includes `unlock-dialog` so the
  extension stays enabled (and keeps switching) on the lock screen.
- Targets GNOME 50 (Ubuntu 26.04) and 51 (Ubuntu 26.10, untested). Before adding a shell
  version, check `gresource extract /usr/lib/gnome-shell/libshell-*.so /org/gnome/shell/ui/status/powerProfiles.js`.
- Test changes: `./install.sh`, then log out/in; logs via `journalctl -f /usr/bin/gnome-shell`.
