package com.foundationenglish.studentbook;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.webkit.WebViewAssetLoader;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public final class MainActivity extends Activity {
    private static final String BASE = "https://appassets.androidplatform.net/assets/web/";
    private static final String START = BASE + "index.html"; // resume last-opened page from localStorage

    private WebView book;
    private TextToSpeech nativeTts;
    private boolean ttsReady = false;
    private View fullScreenView;
    private WebChromeClient.CustomViewCallback fullScreenCallback;
    private FrameLayout contentFrame;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(54, 105, 108));
        getWindow().setNavigationBarColor(Color.rgb(40, 55, 57));

        contentFrame = new FrameLayout(this);
        setContentView(contentFrame);

        if (Build.VERSION.SDK_INT >= 35) {
            contentFrame.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                contentFrame.setPadding(0, bars.top, 0, bars.bottom);
                return insets;
            });
        }

        book = new WebView(this);
        contentFrame.addView(book, new FrameLayout.LayoutParams(-1, -1));
        book.setBackgroundColor(Color.rgb(237, 240, 241));
        final WebSettings settings = book.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        book.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                final Uri uri = request.getUrl();
                if ("appassets.androidplatform.net".equals(uri.getHost())) {
                    return !uri.getPath().startsWith("/assets/web/");
                }
                if (request.isForMainFrame()) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (Exception ignored) { /* never hand arbitrary navigation to the WebView */ }
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (url != null && url.startsWith(BASE)) {
                    injectNativeSpeechShim();
                }
            }
        });

        book.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullScreenView != null) { callback.onCustomViewHidden(); return; }
                fullScreenView = view;
                fullScreenCallback = callback;
                book.setVisibility(View.GONE);
                contentFrame.addView(fullScreenView, new FrameLayout.LayoutParams(-1,-1));
            }

            @Override
            public void onHideCustomView() {
                if (fullScreenView == null) return;
                contentFrame.removeView(fullScreenView);
                fullScreenView = null;
                book.setVisibility(View.VISIBLE);
                if (fullScreenCallback != null) fullScreenCallback.onCustomViewHidden();
                fullScreenCallback = null;
            }
        });

        initializeNativeTts();
        book.addJavascriptInterface(new AndroidSpeechBridge(), "AndroidSpeech");
        // All 45 static pages, quiz content and visual files are packaged in the APK.
        // The original HTML's localStorage progress survives app restarts on this origin.
        book.loadUrl(START);
    }

    private void initializeNativeTts() {
        nativeTts = new TextToSpeech(this, status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                int availability = nativeTts.setLanguage(Locale.US);
                ttsReady = availability != TextToSpeech.LANG_MISSING_DATA
                        && availability != TextToSpeech.LANG_NOT_SUPPORTED;
                nativeTts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) {}
                    @Override public void onDone(String id) { sendSpeechResult(id, true); }
                    @Override public void onError(String id) { sendSpeechResult(id, false); }
                });
            }
        });
    }

    private void sendSpeechResult(String id, boolean succeeded) {
        if (book == null || !id.matches("[0-9]{1,10}")) return;
        book.post(() -> {
            if (book != null) book.evaluateJavascript(
                "window.__foundationTtsDone && window.__foundationTtsDone("
                   + id + "," + succeeded + ")", null);
        });
    }

    private String readAsset(String name) throws Exception {
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                getAssets().open(name), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) builder.append(line).append('\n');
        }
        return builder.toString();
    }

    private void injectNativeSpeechShim() {
        try { book.evaluateJavascript(readAsset("native-tts-shim.js"), null); }
        catch (Exception ignored) { /* prerecorded clips continue to work */ }
    }

    private final class AndroidSpeechBridge {
        @JavascriptInterface
        public void speak(String text, double speed, int id) {
            if (text == null || text.length() > 600 || id < 0) return;
            runOnUiThread(() -> {
                if (nativeTts == null || !ttsReady) {
                    sendSpeechResult(String.valueOf(id), false);
                    return;
                }
                float rate = (float) Math.max(.55, Math.min(1.15, speed));
                nativeTts.setSpeechRate(rate);
                int result = nativeTts.speak(text, TextToSpeech.QUEUE_FLUSH, null,
                        String.valueOf(id));
                if (result == TextToSpeech.ERROR) sendSpeechResult(String.valueOf(id), false);
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> { if (nativeTts != null) nativeTts.stop(); });
        }
    }

    @Override
    public void onBackPressed() {
        if (fullScreenView != null) {
            book.getWebChromeClient().onHideCustomView();
            return;
        }
        if (book == null) { super.onBackPressed(); return; }
        book.evaluateJavascript("(function(){const p=document.getElementById('prev');"
                + "if(p&&!p.disabled){p.click();return true;}return false;})()", value -> {
            if ("false".equals(value)) finish();
        });
    }

    @Override
    protected void onDestroy() {
        if (nativeTts != null) { nativeTts.stop(); nativeTts.shutdown(); nativeTts = null; }
        if (book != null) {
            book.loadUrl("about:blank");
            book.removeJavascriptInterface("AndroidSpeech");
            book.destroy();
            book = null;
        }
        super.onDestroy();
    }
}
