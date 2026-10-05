package com.sinifasistani.app;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebResourceError;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import android.provider.MediaStore;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.List;
import android.webkit.PermissionRequest;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ValueCallback<Uri[]> fileUploadCallback;
    private WebChromeClient.FileChooserParams pendingFileChooserParams;
    private ActivityResultLauncher<Intent> fileChooserLauncher;
    private ActivityResultLauncher<String> cameraPermissionLauncher;
    private PermissionRequest pendingWebPermissionRequest;
    private Uri cameraPhotoUri;
    private File currentPhotoFile;
    private String currentPhotoPath;

    private WebView printWebViewHolder;
    private boolean isAppFullscreen = false;

    private File createCameraFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "IMG_" + timeStamp + "_";
        File storageDir = getExternalCacheDir();
        if (storageDir == null) {
            storageDir = getCacheDir();
        }
        if (storageDir != null && !storageDir.exists()) {
            storageDir.mkdirs();
        }
        File file = File.createTempFile(imageFileName, ".jpg", storageDir);
        currentPhotoFile = file;
        currentPhotoPath = file.getAbsolutePath();
        return file;
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public boolean toggleFullscreen() {
            isAppFullscreen = !isAppFullscreen;
            final boolean fs = isAppFullscreen;
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    android.view.WindowInsetsController controller = getWindow().getInsetsController();
                    if (controller != null) {
                        int types = android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars();
                        if (fs) {
                            controller.hide(types);
                            controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                        } else {
                            controller.show(types);
                        }
                    }
                } else {
                    android.view.View decorView = getWindow().getDecorView();
                    if (fs) {
                        decorView.setSystemUiVisibility(
                            android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
                            | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        );
                    } else {
                        decorView.setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE);
                    }
                }
            });
            return isAppFullscreen;
        }

        @JavascriptInterface
        public boolean isFullscreen() {
            return isAppFullscreen;
        }

        @JavascriptInterface
        public void vibrate(long milliseconds) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(milliseconds);
                    }
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> Toast.makeText(mContext, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void shareData(String content, String title, String mimeType) {
            try {
                Intent sendIntent = new Intent();
                sendIntent.setAction(Intent.ACTION_SEND);
                sendIntent.putExtra(Intent.EXTRA_TEXT, content);
                sendIntent.setType(mimeType != null && !mimeType.isEmpty() ? mimeType : "text/plain");
                Intent shareIntent = Intent.createChooser(sendIntent, title);
                startActivity(shareIntent);
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(mContext, "Paylaşım hatası: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }
        }

        @JavascriptInterface
        public void printHtml(String htmlContent, String documentName) {
            try {
                runOnUiThread(() -> {
                    android.print.PrintManager printManager = (android.print.PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (printManager == null) {
                        Toast.makeText(mContext, "Yazdırma servisi bulunamadı", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    // Varsa önceki geçici yazdırma WebView'ını temizle
                    if (printWebViewHolder != null) {
                        try {
                            printWebViewHolder.destroy();
                        } catch (Exception ignored) {}
                        printWebViewHolder = null;
                    }

                    // Ana WebView'ı ve arayüzü etkilememesi için izole bir yazdırma WebView'ı oluştur
                    WebView printWebView = new WebView(MainActivity.this);
                    printWebViewHolder = printWebView;

                    WebSettings pSettings = printWebView.getSettings();
                    pSettings.setJavaScriptEnabled(true);
                    pSettings.setDomStorageEnabled(true);

                    final String jobName = (documentName != null && !documentName.isEmpty()) ? documentName : "Sinif_Asistani_Belge";

                    printWebView.setWebViewClient(new WebViewClient() {
                        private boolean hasFired = false;

                        @Override
                        public void onPageFinished(WebView view, String url) {
                            if (hasFired) return;
                            hasFired = true;

                            android.print.PrintDocumentAdapter rawAdapter = printWebView.createPrintDocumentAdapter(jobName);
                            android.print.PrintAttributes.Builder builder = new android.print.PrintAttributes.Builder();
                            builder.setMediaSize(android.print.PrintAttributes.MediaSize.ISO_A4);
                            builder.setMinMargins(new android.print.PrintAttributes.Margins(100, 100, 100, 100)); // ~2.5mm marj

                            android.print.PrintDocumentAdapter wrappedAdapter = new android.print.PrintDocumentAdapter() {
                                @Override
                                public void onStart() {
                                    rawAdapter.onStart();
                                }

                                @Override
                                public void onLayout(android.print.PrintAttributes oldAttributes, android.print.PrintAttributes newAttributes, android.os.CancellationSignal cancellationSignal, LayoutResultCallback callback, Bundle extras) {
                                    rawAdapter.onLayout(oldAttributes, newAttributes, cancellationSignal, callback, extras);
                                }

                                @Override
                                public void onWrite(android.print.PageRange[] pages, android.os.ParcelFileDescriptor destination, android.os.CancellationSignal cancellationSignal, WriteResultCallback callback) {
                                    rawAdapter.onWrite(pages, destination, cancellationSignal, callback);
                                }

                                @Override
                                public void onFinish() {
                                    rawAdapter.onFinish();
                                    runOnUiThread(() -> {
                                        if (printWebViewHolder != null) {
                                            try {
                                                printWebViewHolder.destroy();
                                            } catch (Exception ignored) {}
                                            printWebViewHolder = null;
                                        }
                                    });
                                }
                            };

                            printManager.print(jobName, wrappedAdapter, builder.build());
                        }
                    });

                    printWebView.loadDataWithBaseURL("https://appassets.androidplatform.net/assets/", htmlContent, "text/html; charset=utf-8", "UTF-8", null);
                });
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(mContext, "Yazdırma hatası: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }
        }

        @JavascriptInterface
        public void printDocument(String documentName) {
            try {
                runOnUiThread(() -> {
                    android.print.PrintManager printManager = (android.print.PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (printManager != null && webView != null) {
                        String jobName = (documentName != null && !documentName.isEmpty()) ? documentName : "Sinif_Asistani_Belge";
                        android.print.PrintDocumentAdapter printAdapter = webView.createPrintDocumentAdapter(jobName);
                        android.print.PrintAttributes.Builder builder = new android.print.PrintAttributes.Builder();
                        builder.setMediaSize(android.print.PrintAttributes.MediaSize.ISO_A4);
                        printManager.print(jobName, printAdapter, builder.build());
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(mContext, "Yazdırma hatası: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }
        }

        @JavascriptInterface
        public boolean hasCameraPermission() {
            return ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        }

        @JavascriptInterface
        public void requestCameraPermission() {
            runOnUiThread(() -> {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
                }
            });
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (currentPhotoPath != null) {
            outState.putString("currentPhotoPath", currentPhotoPath);
        }
    }

    private void launchFileChooser(WebChromeClient.FileChooserParams fileChooserParams) {
        Intent takePictureIntent = null;
        cameraPhotoUri = null;
        currentPhotoFile = null;

        boolean canUseCamera = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;

        if (canUseCamera) {
            try {
                currentPhotoFile = createCameraFile();
                cameraPhotoUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", currentPhotoFile);
                takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri);
                takePictureIntent.setClipData(android.content.ClipData.newRawUri("", cameraPhotoUri));
                takePictureIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);

                List<android.content.pm.ResolveInfo> resInfoList = getPackageManager().queryIntentActivities(takePictureIntent, PackageManager.MATCH_DEFAULT_ONLY);
                for (android.content.pm.ResolveInfo resolveInfo : resInfoList) {
                    String packageName = resolveInfo.activityInfo.packageName;
                    grantUriPermission(packageName, cameraPhotoUri, Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }
            } catch (Exception e) {
                cameraPhotoUri = null;
                currentPhotoFile = null;
                takePictureIntent = null;
            }
        }

        // Eğer HTML input'unda capture="environment" belirtilmişse doğrudan kamerayı başlat
        if (fileChooserParams.isCaptureEnabled() && takePictureIntent != null) {
            try {
                fileChooserLauncher.launch(takePictureIntent);
                return;
            } catch (Exception ignored) {}
        }

        Intent contentSelectionIntent = fileChooserParams.createIntent();
        Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
        chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
        chooserIntent.putExtra(Intent.EXTRA_TITLE, "Fotoğraf veya Belge Seç");
        if (takePictureIntent != null) {
            chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{takePictureIntent});
        }

        try {
            fileChooserLauncher.launch(chooserIntent);
        } catch (Exception e) {
            if (fileUploadCallback != null) {
                fileUploadCallback.onReceiveValue(null);
                fileUploadCallback = null;
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        if (savedInstanceState != null) {
            currentPhotoPath = savedInstanceState.getString("currentPhotoPath");
            if (currentPhotoPath != null) {
                currentPhotoFile = new File(currentPhotoPath);
                try {
                    cameraPhotoUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", currentPhotoFile);
                } catch (Exception ignored) {}
            }
        }

        webView = findViewById(R.id.webview);

        cameraPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            isGranted -> {
                if (pendingWebPermissionRequest != null) {
                    if (isGranted) {
                        pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
                    } else {
                        pendingWebPermissionRequest.deny();
                        Toast.makeText(this, "Kamera izni verilmedi. Optik form okumak için kamera izni gereklidir.", Toast.LENGTH_LONG).show();
                    }
                    pendingWebPermissionRequest = null;
                } else if (pendingFileChooserParams != null && fileUploadCallback != null) {
                    WebChromeClient.FileChooserParams params = pendingFileChooserParams;
                    pendingFileChooserParams = null;
                    launchFileChooser(params);
                }
            }
        );

        fileChooserLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (fileUploadCallback != null) {
                    Uri[] results = null;
                    if (result.getResultCode() == RESULT_OK) {
                        if (result.getData() == null || result.getData().getData() == null) {
                            if (cameraPhotoUri != null && currentPhotoFile != null && currentPhotoFile.exists() && currentPhotoFile.length() > 0) {
                                results = new Uri[]{cameraPhotoUri};
                            } else if (cameraPhotoUri != null) {
                                results = new Uri[]{cameraPhotoUri};
                            }
                        } else {
                            if (result.getData().getClipData() != null) {
                                int count = result.getData().getClipData().getItemCount();
                                results = new Uri[count];
                                for (int i = 0; i < count; i++) {
                                    results[i] = result.getData().getClipData().getItemAt(i).getUri();
                                }
                            } else if (result.getData().getData() != null) {
                                results = new Uri[]{result.getData().getData()};
                            }
                        }

                        // Bazı kamera uygulamaları EXTRA_OUTPUT dosyasına yazmayıp küçük resim (thumbnail) döndürür
                        if ((results == null || results.length == 0) && result.getData() != null && result.getData().getExtras() != null) {
                            Object bmpObj = result.getData().getExtras().get("data");
                            if (bmpObj instanceof android.graphics.Bitmap) {
                                try {
                                    if (currentPhotoFile == null) currentPhotoFile = createCameraFile();
                                    java.io.FileOutputStream fos = new java.io.FileOutputStream(currentPhotoFile);
                                    ((android.graphics.Bitmap) bmpObj).compress(android.graphics.Bitmap.CompressFormat.JPEG, 92, fos);
                                    fos.flush();
                                    fos.close();
                                    cameraPhotoUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", currentPhotoFile);
                                    results = new Uri[]{cameraPhotoUri};
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                    fileUploadCallback.onReceiveValue(results);
                    fileUploadCallback = null;
                }
            }
        );

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = assetLoader.shouldInterceptRequest(request.getUrl());
                if (response != null) return response;
                return super.shouldInterceptRequest(view, request);
            }

            @SuppressWarnings("deprecation")
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                if (url != null) {
                    WebResourceResponse response = assetLoader.shouldInterceptRequest(Uri.parse(url));
                    if (response != null) return response;
                }
                return super.shouldInterceptRequest(view, url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if (host != null && host.equals("appassets.androidplatform.net")) {
                    return false;
                }
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    Uri url = request.getUrl();
                    if (url != null && "appassets.androidplatform.net".equals(url.getHost())) {
                        view.post(() -> view.loadUrl("file:///android_asset/mobile.html"));
                    }
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean requiresCamera = false;
                    for (String res : request.getResources()) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res)) {
                            requiresCamera = true;
                            break;
                        }
                    }

                    if (requiresCamera) {
                        if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                            request.grant(request.getResources());
                        } else {
                            pendingWebPermissionRequest = request;
                            cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
                        }
                    } else {
                        request.grant(request.getResources());
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                              FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                boolean hasCameraPermission = ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
                if (!hasCameraPermission) {
                    pendingFileChooserParams = fileChooserParams;
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
                    return true;
                }

                launchFileChooser(fileChooserParams);
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, final android.webkit.JsResult result) {
                new androidx.appcompat.app.AlertDialog.Builder(MainActivity.this)
                    .setTitle("Sınıf Asistanı")
                    .setIcon(android.R.drawable.ic_dialog_alert)
                    .setMessage(message)
                    .setPositiveButton("Tamam", (dialog, which) -> result.confirm())
                    .setNegativeButton("İptal", (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel())
                    .setCancelable(false)
                    .show();
                return true;
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, final android.webkit.JsResult result) {
                new androidx.appcompat.app.AlertDialog.Builder(MainActivity.this)
                    .setTitle("Sınıf Asistanı")
                    .setIcon(android.R.drawable.ic_dialog_info)
                    .setMessage(message)
                    .setPositiveButton("Tamam", (dialog, which) -> result.confirm())
                    .setOnCancelListener(dialog -> result.cancel())
                    .setCancelable(false)
                    .show();
                return true;
            }
        });

        // Load the mobile app
        webView.loadUrl("https://appassets.androidplatform.net/assets/mobile.html");

        // Handle Android Back button
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                webView.evaluateJavascript("if (window.handleAndroidBack && window.handleAndroidBack()) { 'handled'; } else { 'not_handled'; }", value -> {
                    if (value == null || !value.contains("handled")) {
                        if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            setEnabled(false);
                            getOnBackPressedDispatcher().onBackPressed();
                        }
                    }
                });
            }
        });
    }
}
