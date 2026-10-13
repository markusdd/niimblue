//! Check the webview prerequisite before Tauri creates any windows.
use std::{fs, os::windows::process::CommandExt, process::Command, thread, time::Duration};

const INSTALL_SCRIPT: &str = include_str!("webview2_install.ps1");
const MB_YESNO: u32 = 0x00000004;
const MB_ICONQUESTION: u32 = 0x00000020;
const MB_ICONERROR: u32 = 0x00000010;
const MB_DEFBUTTON2: u32 = 0x00000100;
const IDYES: i32 = 6;
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[link(name = "user32")]
extern "system" {
    fn MessageBoxW(
        window: *mut std::ffi::c_void,
        text: *const u16,
        title: *const u16,
        flags: u32,
    ) -> i32;
}

#[link(name = "kernel32")]
extern "system" {
    fn GetUserDefaultUILanguage() -> u16;
}

fn localized(english: &'static str, german: &'static str) -> &'static str {
    // The primary language ID is shared by all German regional variants.
    if unsafe { GetUserDefaultUILanguage() } & 0x03ff == 7 {
        german
    } else {
        english
    }
}

fn message(text: &str, flags: u32) -> i32 {
    let text: Vec<u16> = text.encode_utf16().chain(Some(0)).collect();
    let title: Vec<u16> = "NiimBlue".encode_utf16().chain(Some(0)).collect();
    // Strings remain alive for this synchronous native dialog; no webview is needed.
    unsafe { MessageBoxW(std::ptr::null_mut(), text.as_ptr(), title.as_ptr(), flags) }
}

fn available() -> bool {
    tauri::webview_version().is_ok_and(|version| !version.trim().is_empty() && version != "0.0.0.0")
}

fn install() -> Result<(), String> {
    let directory =
        std::env::temp_dir().join(format!("niimblue-webview2-{}", uuid::Uuid::new_v4()));
    fs::create_dir(&directory).map_err(|e| e.to_string())?;
    let result = (|| {
        let script = directory.join("install.ps1");
        let installer = directory.join("MicrosoftEdgeWebview2Setup.exe");
        fs::write(&script, INSTALL_SCRIPT).map_err(|e| e.to_string())?;
        // Use the OS PowerShell executable, rather than searching PATH or the EXE folder.
        let system_root =
            std::env::var_os("SystemRoot").ok_or("Windows system directory is unavailable")?;
        let powershell = std::path::PathBuf::from(system_root)
            .join("System32/WindowsPowerShell/v1.0/powershell.exe");
        let output = Command::new(powershell)
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
            ])
            .arg(&script)
            .arg("-InstallerPath")
            .arg(&installer)
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| e.to_string())?;
        if !output.status.success() {
            return Err(format!(
                "WebView2 setup failed: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            ));
        }
        // Give Windows a moment to make the installed runtime discoverable.
        for _ in 0..10 {
            if available() {
                return Ok(());
            }
            thread::sleep(Duration::from_millis(500));
        }
        Err("WebView2 is still unavailable after setup".into())
    })();
    let _ = fs::remove_dir_all(directory);
    result
}

pub fn ensure_available() -> bool {
    if available() {
        return true;
    }
    let prompt = localized(
        "NiimBlue needs Microsoft WebView2 Runtime to display its window.\n\nDownload and install it from Microsoft now? An internet connection is required. Installation may take a few minutes; NiimBlue will open when it finishes.",
        "NiimBlue benötigt Microsoft WebView2 Runtime zur Anzeige des Fensters.\n\nJetzt von Microsoft herunterladen und installieren? Eine Internetverbindung ist erforderlich. Die Installation kann einige Minuten dauern; danach öffnet sich NiimBlue.",
    );
    if message(prompt, MB_YESNO | MB_ICONQUESTION | MB_DEFBUTTON2) != IDYES {
        return false;
    }
    match install() {
        Ok(()) => true,
        Err(error) => {
            eprintln!("{error}");
            message(localized(
                "Microsoft WebView2 Runtime could not be installed or detected.\n\nCheck your internet connection and try again, or install the Evergreen WebView2 Runtime from Microsoft's website. Then reopen NiimBlue.",
                "Microsoft WebView2 Runtime konnte nicht installiert oder erkannt werden.\n\nBitte die Internetverbindung prüfen und erneut versuchen oder die Evergreen WebView2 Runtime von Microsoft manuell installieren. Anschließend NiimBlue erneut öffnen.",
            ), MB_ICONERROR);
            false
        }
    }
}
