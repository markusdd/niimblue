use std::collections::BTreeSet;

/// Return every family alias exposed by fontdb, in sorted order without duplicates.
fn sorted_unique_families<'a>(families: impl IntoIterator<Item = &'a str>) -> Vec<String> {
    families
        .into_iter()
        .map(str::to_owned)
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect()
}

#[tauri::command]
pub async fn list_system_fonts() -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut database = fontdb::Database::new();
        database.load_system_fonts();

        let families = database
            .faces()
            .flat_map(|face| face.families.iter().map(|(name, _language)| name.as_str()));

        sorted_unique_families(families)
    })
    .await
    .map_err(|error| format!("Could not enumerate system fonts: {error}"))
}

#[cfg(test)]
mod tests {
    use super::sorted_unique_families;

    #[test]
    fn families_are_deduplicated_and_sorted() {
        assert_eq!(
            sorted_unique_families(["Zulu Sans", "Alpha", "Zulu Sans", "Beta"]),
            ["Alpha", "Beta", "Zulu Sans"]
        );
    }

    #[test]
    fn empty_family_list_stays_empty() {
        assert!(sorted_unique_families(std::iter::empty()).is_empty());
    }

    #[test]
    fn family_names_are_preserved() {
        assert_eq!(
            sorted_unique_families(["Noto Sans CJK JP", "DejaVu Serif"]),
            ["DejaVu Serif", "Noto Sans CJK JP"]
        );
    }
}
