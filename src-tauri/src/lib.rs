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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_machine_id])
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
