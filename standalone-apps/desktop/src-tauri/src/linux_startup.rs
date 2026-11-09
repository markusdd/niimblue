use std::ffi::OsStr;

fn default_backend(
    appimage: Option<&OsStr>,
    display: Option<&OsStr>,
    explicit_backend: Option<&OsStr>,
) -> Option<&'static str> {
    // Bundled GTK can fail to allocate a Wayland surface on HiDPI desktops.
    // Prefer XWayland when available, while retaining a native Wayland fallback.
    if appimage.is_some()
        && display.is_some_and(|value| !value.is_empty())
        && explicit_backend.is_none()
    {
        Some("x11,wayland")
    } else {
        None
    }
}

/// Run before Tauri initializes GTK or starts worker threads.
pub fn configure() {
    if let Some(backend) = default_backend(
        std::env::var_os("APPIMAGE").as_deref(),
        std::env::var_os("DISPLAY").as_deref(),
        std::env::var_os("GDK_BACKEND").as_deref(),
    ) {
        std::env::set_var("GDK_BACKEND", backend);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn appimage_prefers_x11_with_wayland_fallback_when_x_display_exists() {
        assert_eq!(
            default_backend(
                Some(OsStr::new("/tmp/NiimBlue.AppImage")),
                Some(OsStr::new(":0")),
                None
            ),
            Some("x11,wayland")
        );
    }

    #[test]
    fn leaves_explicit_backend_and_wayland_only_sessions_alone() {
        let image = Some(OsStr::new("/tmp/NiimBlue.AppImage"));
        for backend in ["wayland", "x11", ""] {
            assert_eq!(
                default_backend(image, Some(OsStr::new(":0")), Some(OsStr::new(backend))),
                None
            );
        }
        assert_eq!(default_backend(image, None, None), None);
        assert_eq!(default_backend(image, Some(OsStr::new("")), None), None);
    }

    #[test]
    fn leaves_unbundled_builds_alone() {
        assert_eq!(default_backend(None, Some(OsStr::new(":0")), None), None);
    }
}
