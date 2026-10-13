# NiimBlue desktop

Tauri desktop shell with native Bluetooth Low Energy through Rust/btleplug.
The folder replaces the former Windows-only wrapper at `standalone-apps/tauri-windows`.
The Svelte editor and niimbluelib printer protocol are shared with the browser app.
The desktop app never uses `navigator.bluetooth`.

## Linux development (Fedora / Nobara)

Install the native build prerequisites from a host terminal:

```sh
sudo dnf install gcc-c++ make gtk3-devel webkit2gtk4.1-devel \
  libappindicator-gtk3-devel librsvg2-devel openssl-devel dbus-devel patchelf
```

Rust/Cargo, Node.js 22.18 or newer, npm, a running BlueZ service and an enabled
Bluetooth adapter are also required. Cargo and npm need network access for the
first dependency installation.

From the repository root:

```sh
npm ci
npm --prefix standalone-apps/desktop ci
npm run desktop:dev
```

This starts a separate Vite server on `127.0.0.1:1420` and opens the desktop
window. It does not use an existing Vite server on another port.
The root `desktop:dev` and `desktop:build` commands automatically install the
desktop npm dependencies when the Tauri CLI is missing.

Close the browser's printer connection before testing the native connection.
In the desktop app, click Bluetooth/connect, turn on the printer, and choose it
from the list. The last selected printer appears first on later searches.

## Windows development

Install Rust with the MSVC toolchain, Visual Studio C++ Build Tools, Node/npm,
and the Microsoft Edge WebView2 Runtime. Run the same npm commands above.
Bluetooth uses btleplug's Windows backend, rather than the webview's Bluetooth API.

## Build an offline application

```sh
npm run desktop:build
```

The release build embeds the production frontend, fonts, icons, presets and
license notices. No hosted website or local web server is needed after install.
Artifacts are written to `src-tauri/target/release/bundle` inside this directory.
The default output is AppImage on Linux, a standalone `NiimBlue.exe` on Windows,
and DMG on macOS. The Windows EXE is written to `src-tauri/target/release/NiimBlue.exe`.
Override the format explicitly when needed:

```sh
npm run desktop:build -- --bundles rpm
npm run desktop:build -- --bundles nsis
npm run desktop:build -- --bundles appimage
```

AppImage packaging runs its tooling in extraction mode so the build does not
require a FUSE mount. It also disables linuxdeploy's optional stripping step:
the bundled old strip executable cannot handle modern ELF RELR sections.
If linuxdeploy still fails, use `--verbose` to see the
underlying tool error. For local testing you can also run
`standalone-apps/desktop/src-tauri/target/release/niimblues` directly.

Build Windows installers on Windows. Linux testing verifies the shared protocol
and Linux Bluetooth path, but the Windows backend still needs a real printer test.
macOS builds include Bluetooth usage descriptions; build/test on macOS separately.

The manual `Desktop builds` GitHub Actions workflow prepares Linux AppImage,
Windows standalone EXE plus NSIS installer, and macOS DMG artifacts without publishing a release.

### Standalone Windows app

Copy `NiimBlue.exe` to a convenient folder and launch it. The frontend, fonts,
icons and presets are embedded; no companion asset folder or app installation
is required. Bluetooth uses the Windows Bluetooth APIs without registration.
Before creating a window, NiimBlue checks for WebView2 Runtime. If it is missing,
a native Windows dialog offers to download and install Microsoft's Evergreen
runtime. This requires internet access, verifies the download's Microsoft
Authenticode signature, and runs the bootstrapper without requesting elevation.
After setup, NiimBlue checks again before opening its window. Declining or a failed
installation closes the app; installation failures show a native error dialog.
The prompt follows the Windows UI language (German or English). The NSIS installer
also handles the runtime prerequisite during installation.
See [Microsoft's runtime distribution guidance](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution).

Saved designs, presets and preferences use the user's app data directories,
not the EXE folder. Keep the application identifier `app.niimblue.desktop`
unchanged across updates to preserve that storage. Replace the EXE while the app
is closed to update it; create a shortcut manually if desired.

## Transport behavior

- Scan all adapters; accept the NIIMBOT service UUID or printer-style names.
- Discover and subscribe to the known NIIMBOT notify/write characteristic.
- Route notifications and disconnects to the main window with a session ID.
- Serialize writes and split them into paced 20-byte ATT payloads, preserving
  the protocol byte stream even with the minimum BLE MTU.
- Invalidate the connection after a partial write; reconnect before printing again.
- Reject pending response waits promptly when the link disconnects.
- Stop discovery after enumeration and disconnect when the app exits.

The browser app retains Web Bluetooth. The desktop chooses the native transport
automatically; it does not add an extra technical setting to the print flow.

## Checks and hardware acceptance

```sh
node tests/native_bluetooth.test.mjs
node tests/bluetooth_response.test.mjs
npm run sv-check
cargo test --manifest-path standalone-apps/desktop/src-tauri/Cargo.toml
```

Tests use a mocked desktop bridge for cancellation, fragmented/early responses,
stale sessions, failed negotiation, disconnects and write failures. Rust policy
tests check discovery filtering and frame-preserving write chunking.

Before gifting or publishing an installer, test on both Linux and Windows:
discovery, connection, printer/ribbon information, a simple label, a dense framed
50 × 30 mm label, repeated prints, canceling connection, switching off the printer,
reconnection and app restart. Verify saved labels and presets after restart.
On Windows also test both the installer and standalone EXE. In a clean Windows
VM without WebView2, verify accepting/declining runtime setup, offline failure,
successful setup and subsequent launches without a prompt.

Desktop storage is separate from browser storage. Export/import label templates
and presets to transfer existing designs into the desktop app.
