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
import android.webkit.PermissionRequest;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ValueCallback<Uri[]> fileUploadCallback;
    private ActivityResultLauncher<Intent> fileChooserLauncher;
    private ActivityResultLauncher<String> cameraPermissionLauncher;
    private PermissionRequest pendingWebPermissionRequest;
    private Uri cameraPhotoUri;

    private WebView printWebViewHolder;

    private File createCameraFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "OMR_" + timeStamp + "_";
        File storageDir = getExternalCacheDir();
        if (storageDir == null) {
            storageDir = getCacheDir();
        }
        return File.createTempFile(imageFileName, ".jpg", storageDir);
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
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
        public void requestCameraPermission() {
            runOnUiThread(() -> {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
                }
            });
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

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
                            if (cameraPhotoUri != null) {
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
                    }
                    fileUploadCallback.onReceiveValue(results);
                    fileUploadCallback = null;
                    cameraPhotoUri = null;
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
                return assetLoader.shouldInterceptRequest(request.getUrl());
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

                Intent takePictureIntent = null;
                cameraPhotoUri = null;

                try {
                    File photoFile = createCameraFile();
                    cameraPhotoUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", photoFile);
                    takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri);
                    takePictureIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } catch (Exception e) {
                    cameraPhotoUri = null;
                }

                // Eğer HTML input'unda capture="environment" belirtilmişse doğrudan kamerayı başlat
                if (fileChooserParams.isCaptureEnabled() && takePictureIntent != null) {
                    try {
                        fileChooserLauncher.launch(takePictureIntent);
                        return true;
                    } catch (Exception ignored) {}
                }

                // Aksi takdirde (örneğin Galeri butonuna basıldığında) hem Galeri hem Kamera içeren seçici sun
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
                    fileUploadCallback = null;
                    return false;
                }
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
