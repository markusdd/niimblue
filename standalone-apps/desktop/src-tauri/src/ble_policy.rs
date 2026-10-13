/// A 20-byte ATT payload also works with the minimum BLE MTU (23 bytes).
pub const WRITE_CHUNK_BYTES: usize = 20;
pub const MAX_WRITE_BYTES: usize = 512;

pub fn printer_name(name: &str) -> bool {
    let name = name.trim().to_ascii_uppercase();
    if name.starts_with("NIIMBOT") {
        return true;
    }
    let prefix = name.split(['-', '_', ' ']).next().unwrap_or("");
    let mut chars = prefix.chars();
    matches!(
        chars.next(),
        Some('A' | 'B' | 'C' | 'D' | 'H' | 'K' | 'M' | 'N' | 'P' | 'S' | 'T')
    ) && chars.next().is_some_and(|c| c.is_ascii_digit())
}

pub fn valid_write(data: &[u8]) -> Result<(), &'static str> {
    if data.is_empty() || data.len() > MAX_WRITE_BYTES {
        return Err("Bluetooth writes must contain 1–512 bytes");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn printer_names_are_filtered() {
        for name in ["M2-H_1234", "D110_M", "B21", "NIIMBOT Printer", " m3-123 "] {
            assert!(printer_name(name), "{name}");
        }
        for name in ["Mouse", "Keyboard", "Headphones", "", "My Phone"] {
            assert!(!printer_name(name), "{name}");
        }
    }

    #[test]
    fn chunks_preserve_the_protocol_byte_stream() {
        let bytes: Vec<u8> = (0..=255).collect();
        let chunks: Vec<_> = bytes.chunks(WRITE_CHUNK_BYTES).collect();
        assert!(chunks.iter().all(|chunk| chunk.len() <= 20));
        assert_eq!(chunks.concat(), bytes);
    }

    #[test]
    fn empty_and_oversized_writes_are_rejected() {
        assert!(valid_write(&[]).is_err());
        assert!(valid_write(&[0; 513]).is_err());
        assert!(valid_write(&[0; 512]).is_ok());
    }
}
