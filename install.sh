#!/bin/bash
# Install the extension for the current user and compile its settings schema.
set -eu
cd "$(dirname "$0")"

uuid=power-profile-auto@chrisotm.github.io
dest=~/.local/share/gnome-shell/extensions/$uuid
mkdir -p "$dest/schemas"
cp extension/metadata.json extension/extension.js extension/prefs.js "$dest/"
cp extension/schemas/*.gschema.xml "$dest/schemas/"
glib-compile-schemas "$dest/schemas"
gnome-extensions enable "$uuid" 2>/dev/null || true

echo "Installed. Log out and back in (Wayland), then: gnome-extensions enable $uuid"
