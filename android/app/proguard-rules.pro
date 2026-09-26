# Proguard rules for Sinif Asistani
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.sinifasistani.app.MainActivity$WebAppInterface {
    public *;
}
