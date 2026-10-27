use tauri::Manager;
use std::process::Command;

#[tauri::command]
fn get_machine_id() -> String {
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = Command::new("wmic").args(&["csproduct", "get", "uuid"]).output() {
            let result = String::from_utf8_lossy(&output.stdout);
            let lines: Vec<&str> = result.lines().collect();
            if lines.len() >= 2 {
                return lines[1].trim().to_string();
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = Command::new("ioreg").args(&["-rd1", "-c", "IOPlatformExpertDevice"]).output() {
            let result = String::from_utf8_lossy(&output.stdout);
            for line in result.lines() {
                if line.contains("IOPlatformUUID") {
                    if let Some(uuid) = line.split('=').last() {
                        return uuid.replace('"', "").trim().to_string();
                    }
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(id) = std::fs::read_to_string("/etc/machine-id") {
            return id.trim().to_string();
        }
        if let Ok(id) = std::fs::read_to_string("/var/lib/dbus/machine-id") {
            return id.trim().to_string();
        }
    }

    "unknown_machine".to_string()
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct PortablePayload {
    pub is_portable: bool,
    pub data_json: Option<String>,
    pub api_key: Option<String>,
    pub portable_path: Option<String>,
}

fn get_portable_dir() -> Option<std::path::PathBuf> {
    #[cfg(target_os = "linux")]
    {
        if let Ok(appimage) = std::env::var("APPIMAGE") {
            let p = std::path::Path::new(&appimage);
            if let Some(parent) = p.parent() {
                if parent.exists() {
                    return Some(parent.to_path_buf());
                }
            }
        }
    }
    // Также destek: çalıştırılabilir dosya yanında .sinif_asistani_tasinabilir varsa
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(parent) = exe_path.parent() {
            let marker = parent.join(".sinif_asistani_tasinabilir");
            if marker.exists() {
                return Some(parent.to_path_buf());
            }
        }
    }
    None
}

fn get_portable_data_file() -> Option<std::path::PathBuf> {
    get_portable_dir().map(|dir| dir.join(".sinif_asistani_tasinabilir").join("sinif_asistani_veriler.json"))
}

#[tauri::command]
fn get_portable_info() -> PortablePayload {
    let dir = get_portable_dir();
    let is_portable = dir.is_some();
    let portable_path = dir.map(|p| p.to_string_lossy().to_string());
    PortablePayload {
        is_portable,
        data_json: None,
        api_key: None,
        portable_path,
    }
}

#[tauri::command]
fn load_portable_data() -> Result<PortablePayload, String> {
    let dir = get_portable_dir();
    let is_portable = dir.is_some();
    let portable_path = dir.as_ref().map(|p| p.to_string_lossy().to_string());

    if let Some(file_path) = get_portable_data_file() {
        if file_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&file_path) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                    let data_json = json.get("sinif_asistani_data").and_then(|v| v.as_str()).map(|s| s.to_string());
                    let api_key = json.get("sinif_asistani_gemini_api_key").and_then(|v| v.as_str()).map(|s| s.to_string());
                    return Ok(PortablePayload {
                        is_portable,
                        data_json,
                        api_key,
                        portable_path,
                    });
                }
            }
        }
    }

    Ok(PortablePayload {
        is_portable,
        data_json: None,
        api_key: None,
        portable_path,
    })
}

#[tauri::command]
fn save_portable_data(data_json: String, api_key: String) -> Result<bool, String> {
    if let Some(dir) = get_portable_dir() {
        let folder = dir.join(".sinif_asistani_tasinabilir");
        if !folder.exists() {
            let _ = std::fs::create_dir_all(&folder);
        }
        let file_path = folder.join("sinif_asistani_veriler.json");
        let now_sec = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);

        let json_obj = serde_json::json!({
            "version": "1.0.27",
            "updated_at": now_sec,
            "sinif_asistani_data": data_json,
            "sinif_asistani_gemini_api_key": api_key,
        });

        if let Ok(serialized) = serde_json::to_string_pretty(&json_obj) {
            if std::fs::write(&file_path, serialized).is_ok() {
                return Ok(true);
            }
        }
    }
    Ok(false)
}

fn write_file_atomic(target_path: &std::path::Path, content: &str) -> bool {
    let tmp_path = target_path.with_extension("json.tmp");
    if std::fs::write(&tmp_path, content).is_ok() {
        if std::fs::rename(&tmp_path, target_path).is_ok() {
            return true;
        }
        let _ = std::fs::remove_file(&tmp_path);
    }
    std::fs::write(target_path, content).is_ok()
}

#[derive(serde::Serialize)]
struct DesktopBackupFileInfo {
    file_name: String,
    updated_at: u64,
    size_bytes: u64,
}

#[tauri::command]
fn save_desktop_data(
    app: tauri::AppHandle,
    data_json: String,
    api_key: String,
    date_key: Option<String>,
    slot_key: Option<String>,
) -> Result<bool, String> {
    if data_json.trim().is_empty() {
        return Ok(false);
    }
    if let Ok(app_dir) = app.path().app_data_dir() {
        if !app_dir.exists() {
            let _ = std::fs::create_dir_all(&app_dir);
        }
        let file_path = app_dir.join("sinif_asistani_veriler.json");
        let backup_path = app_dir.join("sinif_asistani_veriler.bak");

        let now_sec = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);

        let json_obj = serde_json::json!({
            "version": "1.0.107",
            "updated_at": now_sec,
            "sinif_asistani_data": data_json,
            "sinif_asistani_gemini_api_key": api_key,
        });

        if let Ok(serialized) = serde_json::to_string_pretty(&json_obj) {
            // Mevcut sağlam dosya varsa ve geçerli JSON içeriyorsa önce .bak yedeği al
            if file_path.exists() {
                if let Ok(existing_content) = std::fs::read_to_string(&file_path) {
                    if existing_content.len() > 100 && serde_json::from_str::<serde_json::Value>(&existing_content).is_ok() {
                        let _ = std::fs::copy(&file_path, &backup_path);
                    }
                }
            }
            if write_file_atomic(&file_path, &serialized) {
                // Günlük Akıllı Paketleme Klasörü (gunluk_yedekler)
                if let Some(ref d_key) = date_key {
                    let backups_dir = app_dir.join("gunluk_yedekler");
                    if !backups_dir.exists() {
                        let _ = std::fs::create_dir_all(&backups_dir);
                    }

                    // 1. Gün Başı Yedeği (Base) - Günün ilk kaydı, yoksa oluştur
                    let base_file = backups_dir.join(format!("yedek_{}_gun_basi.json", d_key));
                    if !base_file.exists() {
                        let _ = write_file_atomic(&base_file, &serialized);
                    }

                    // 1b. Saat Dilimi Ara Yedeği (Slot) - Gün içi zaman dilimi kayıplarını önler
                    if let Some(ref s_key) = slot_key {
                        let clean_slot: String = s_key.chars().filter(|c| c.is_alphanumeric() || *c == '-').collect();
                        if !clean_slot.is_empty() {
                            let slot_file = backups_dir.join(format!("yedek_{}_saat_{}.json", d_key, clean_slot));
                            let _ = write_file_atomic(&slot_file, &serialized);
                        }
                    }

                    // 2. Gün Sonu / Güncel Kapanış Yedeği (Latest) - Gün boyunca güncellenir
                    let latest_file = backups_dir.join(format!("yedek_{}_kapanis.json", d_key));
                    let _ = write_file_atomic(&latest_file, &serialized);

                    // 3. Son 10 Aktif Günlük Rotasyon (Eski günleri temizle)
                    if let Ok(entries) = std::fs::read_dir(&backups_dir) {
                        let mut dates: std::collections::BTreeSet<String> = std::collections::BTreeSet::new();
                        let mut files: Vec<(String, std::path::PathBuf)> = Vec::new();

                        for entry in entries.flatten() {
                            let name = entry.file_name().to_string_lossy().to_string();
                            if name.starts_with("yedek_") && name.ends_with(".json") {
                                let parts: Vec<&str> = name.split('_').collect();
                                if parts.len() >= 2 {
                                    let dt = parts[1].to_string();
                                    dates.insert(dt.clone());
                                    files.push((dt, entry.path()));
                                }
                            }
                        }

                        if dates.len() > 10 {
                            let dates_vec: Vec<String> = dates.into_iter().collect();
                            let to_remove_count = dates_vec.len() - 10;
                            let remove_dates: std::collections::HashSet<String> = dates_vec.into_iter().take(to_remove_count).collect();
                            for (dt, path) in files {
                                if remove_dates.contains(&dt) {
                                    let _ = std::fs::remove_file(path);
                                }
                            }
                        }
                    }
                }

                return Ok(true);
            }
        }
    }
    Ok(false)
}

#[tauri::command]
fn list_desktop_backups(app: tauri::AppHandle) -> Result<Vec<DesktopBackupFileInfo>, String> {
    let mut result: Vec<DesktopBackupFileInfo> = Vec::new();
    if let Ok(app_dir) = app.path().app_data_dir() {
        let backups_dir = app_dir.join("gunluk_yedekler");
        if backups_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&backups_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    let name = entry.file_name().to_string_lossy().to_string();
                    if name.starts_with("yedek_") && name.ends_with(".json") {
                        if let Ok(meta) = std::fs::metadata(&path) {
                            let updated_at = meta
                                .modified()
                                .ok()
                                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                .map(|d| d.as_secs())
                                .unwrap_or(0);
                            result.push(DesktopBackupFileInfo {
                                file_name: name,
                                updated_at,
                                size_bytes: meta.len(),
                            });
                        }
                    }
                }
            }
        }
    }
    result.sort_by(|a, b| b.file_name.cmp(&a.file_name));
    Ok(result)
}

#[tauri::command]
fn load_desktop_backup_file(app: tauri::AppHandle, file_name: String) -> Result<Option<String>, String> {
    if file_name.contains("..") || file_name.contains('/') || file_name.contains('\\') {
        return Err("Geçersiz yedek dosya adı".to_string());
    }
    if let Ok(app_dir) = app.path().app_data_dir() {
        let target_path = if file_name == "sinif_asistani_veriler.bak" {
            app_dir.join("sinif_asistani_veriler.bak")
        } else {
            app_dir.join("gunluk_yedekler").join(&file_name)
        };
        if target_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&target_path) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(data) = json.get("sinif_asistani_data").and_then(|v| v.as_str()) {
                        if !data.trim().is_empty() {
                            return Ok(Some(data.to_string()));
                        }
                    }
                }
            }
        }
    }
    Ok(None)
}

#[tauri::command]
fn load_desktop_data(app: tauri::AppHandle) -> Result<Option<String>, String> {
    if let Ok(app_dir) = app.path().app_data_dir() {
        let file_path = app_dir.join("sinif_asistani_veriler.json");
        let backup_path = app_dir.join("sinif_asistani_veriler.bak");

        // 1. Önce ana dosyayı kontrol et
        if file_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&file_path) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(data) = json.get("sinif_asistani_data").and_then(|v| v.as_str()) {
                        if !data.trim().is_empty() {
                            return Ok(Some(content));
                        }
                    }
                }
            }
        }

        // 2. Ana dosya boş veya bozulmuşsa yedek dosyadan kurtar
        if backup_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&backup_path) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(data) = json.get("sinif_asistani_data").and_then(|v| v.as_str()) {
                        if !data.trim().is_empty() {
                            return Ok(Some(content));
                        }
                    }
                }
            }
        }

        // 3. Günlük yedekler klasöründen en son geçerli yedeği kurtar
        let backups_dir = app_dir.join("gunluk_yedekler");
        if backups_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&backups_dir) {
                let mut backup_files: Vec<std::path::PathBuf> = entries
                    .flatten()
                    .map(|e| e.path())
                    .filter(|p| {
                        let name = p.file_name().unwrap_or_default().to_string_lossy();
                        name.starts_with("yedek_") && name.ends_with(".json")
                    })
                    .collect();
                // Ada göre ters sırala (en yeni tarih en başta)
                backup_files.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

                for b_file in backup_files {
                    if let Ok(content) = std::fs::read_to_string(&b_file) {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(data) = json.get("sinif_asistani_data").and_then(|v| v.as_str()) {
                                if !data.trim().is_empty() {
                                    return Ok(Some(content));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(None)
}

#[tauri::command]
fn open_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    if let Ok(app_dir) = app.path().app_data_dir() {
        if !app_dir.exists() {
            let _ = std::fs::create_dir_all(&app_dir);
        }
        let path_str = app_dir.to_string_lossy().to_string();

        #[cfg(target_os = "windows")]
        {
            let _ = Command::new("explorer").arg(&path_str).spawn();
        }
        #[cfg(target_os = "macos")]
        {
            let _ = Command::new("open").arg(&path_str).spawn();
        }
        #[cfg(target_os = "linux")]
        {
            let _ = Command::new("xdg-open").arg(&path_str).spawn();
        }

        return Ok(path_str);
    }
    Err("Uygulama klasörü bulunamadı".to_string())
}

#[tauri::command]
fn open_external_url(url: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("cmd").args(&["/c", "start", "", &url]).spawn();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg(&url).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = Command::new("xdg-open").arg(&url).spawn();
    }
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_machine_id,
            get_portable_info,
            load_portable_data,
            save_portable_data,
            save_desktop_data,
            load_desktop_data,
            list_desktop_backups,
            load_desktop_backup_file,
            open_app_data_dir,
            open_external_url
        ])
        .setup(|app| {
            let _window = app.get_webview_window("main").unwrap();
            // Geliştirme modunda DevTools'u etkinleştir
            #[cfg(debug_assertions)]
            _window.open_devtools();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Tauri uygulaması başlatılamadı");
}
