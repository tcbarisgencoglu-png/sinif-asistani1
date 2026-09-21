// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Taşınabilir AppImage (USB Flash Bellek) kontrolü:
        // Uygulama bir AppImage olarak (örneğin akıllı tahtada Flash disk üzerinden) çalıştırıldığında,
        // verileri tahtanın /home/etap yerel diskine değil, doğrudan Flash diskin içerisine kaydetmesi için
        // XDG_DATA_HOME ve XDG_CONFIG_HOME dizinlerini otomatik olarak Flash diske yönlendiriyoruz.
        if let Ok(appimage_path) = std::env::var("APPIMAGE") {
            let p = std::path::Path::new(&appimage_path);
            if let Some(parent) = p.parent() {
                let portable_dir = parent.join(".sinif_asistani_tasinabilir");
                if std::fs::create_dir_all(&portable_dir).is_ok() {
                    let data_dir = portable_dir.join("data");
                    let config_dir = portable_dir.join("config");
                    let _ = std::fs::create_dir_all(&data_dir);
                    let _ = std::fs::create_dir_all(&config_dir);
                    
                    std::env::set_var("XDG_DATA_HOME", &data_dir);
                    std::env::set_var("XDG_CONFIG_HOME", &config_dir);
                }
            }
        }
    }

    sinif_asistani_lib::run()
}
