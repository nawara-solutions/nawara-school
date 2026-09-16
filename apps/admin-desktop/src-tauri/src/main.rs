// Rust does privileged work: device fingerprint, license token, filesystem.
// Fingerprint = salted hash of MAC + disk serial + CPU ID + OS install ID —
// never MAC alone. Raw components never leave the device (CLAUDE.md §10).
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
