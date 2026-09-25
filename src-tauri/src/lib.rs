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
            "version": "1.0.26",
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
            save_portable_data
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
