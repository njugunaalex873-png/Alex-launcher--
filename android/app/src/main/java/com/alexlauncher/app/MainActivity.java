package com.alexlauncher.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "AlexLauncherNative";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().addJavascriptInterface(new AlexAndroidBridge(this), "AlexAndroid");
                Log.i(TAG, "AlexAndroid bridge registered with WebView");
            }
        } catch (Throwable t) {
            Log.e(TAG, "Failed to register AlexAndroid bridge", t);
        }
    }

    public class AlexAndroidBridge {
        private final Context context;

        public AlexAndroidBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String getInstalledApps() {
            try {
                PackageManager pm = context.getPackageManager();
                Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
                mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

                List<ResolveInfo> resolveInfos = pm.queryIntentActivities(mainIntent, 0);
                if (resolveInfos == null) {
                    return "[]";
                }

                String myPackage = context.getPackageName();
                List<ResolveInfo> filtered = new ArrayList<>();
                for (ResolveInfo info : resolveInfos) {
                    if (info.activityInfo != null && !myPackage.equals(info.activityInfo.packageName)) {
                        filtered.add(info);
                    }
                }

                Collections.sort(filtered, new Comparator<ResolveInfo>() {
                    @Override
                    public int compare(ResolveInfo a, ResolveInfo b) {
                        String labelA = a.loadLabel(pm).toString();
                        String labelB = b.loadLabel(pm).toString();
                        return labelA.compareToIgnoreCase(labelB);
                    }
                });

                JSONArray jsonArray = new JSONArray();
                for (ResolveInfo info : filtered) {
                    String packageName = info.activityInfo.packageName;
                    CharSequence labelSeq = info.loadLabel(pm);
                    String label = (labelSeq != null && labelSeq.length() > 0) ? labelSeq.toString() : info.activityInfo.name;

                    String category = "Tools";
                    try {
                        ApplicationInfo appInfo = info.activityInfo.applicationInfo;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && appInfo != null) {
                            int cat = appInfo.category;
                            if (cat == ApplicationInfo.CATEGORY_GAME) {
                                category = "Games";
                            } else if (cat == ApplicationInfo.CATEGORY_AUDIO || cat == ApplicationInfo.CATEGORY_VIDEO || cat == ApplicationInfo.CATEGORY_IMAGE) {
                                category = "Media";
                            } else if (cat == ApplicationInfo.CATEGORY_SOCIAL) {
                                category = "Social";
                            } else if (cat == ApplicationInfo.CATEGORY_PRODUCTIVITY) {
                                category = "Productivity";
                            } else if (cat == ApplicationInfo.CATEGORY_NEWS || cat == ApplicationInfo.CATEGORY_MAPS) {
                                category = "Tools";
                            } else {
                                category = guessCategory(packageName, label);
                            }
                        } else {
                            category = guessCategory(packageName, label);
                        }
                    } catch (Throwable t) {
                        category = guessCategory(packageName, label);
                    }

                    String iconData = "";
                    try {
                        Drawable drawable = info.loadIcon(pm);
                        iconData = drawableToBase64(drawable);
                    } catch (Throwable t) {
                        // ignore icon failure
                    }

                    JSONObject appObj = new JSONObject();
                    appObj.put("name", label);
                    appObj.put("label", label);
                    appObj.put("packageName", packageName);
                    appObj.put("category", category);
                    if (iconData != null && !iconData.isEmpty()) {
                        appObj.put("icon", iconData);
                    }
                    jsonArray.put(appObj);
                }

                return jsonArray.toString();
            } catch (Throwable e) {
                Log.e(TAG, "Error fetching installed apps", e);
                return "[]";
            }
        }

        @JavascriptInterface
        public boolean launchApp(String packageName) {
            if (packageName == null || packageName.trim().isEmpty()) {
                return false;
            }
            try {
                PackageManager pm = context.getPackageManager();
                Intent launchIntent = pm.getLaunchIntentForPackage(packageName.trim());
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                    context.startActivity(launchIntent);
                    return true;
                }
            } catch (Throwable e) {
                Log.e(TAG, "Error launching app " + packageName, e);
            }
            return false;
        }

        @JavascriptInterface
        public boolean openHomeSettings() {
            try {
                Intent intent = new Intent(Settings.ACTION_HOME_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                return true;
            } catch (Throwable e) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    return true;
                } catch (Throwable e2) {
                    try {
                        Intent intent = new Intent(Settings.ACTION_SETTINGS);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(intent);
                        return true;
                    } catch (Throwable e3) {
                        return false;
                    }
                }
            }
        }

        @JavascriptInterface
        public boolean lockScreen() {
            return false;
        }

        @JavascriptInterface
        public String getNotifications() {
            return "[]";
        }

        @JavascriptInterface
        public String getMediaState() {
            return "{}";
        }

        @JavascriptInterface
        public boolean sendMediaAction(String action, int value) {
            return true;
        }

        @JavascriptInterface
        public String getRecentTasks() {
            return "[]";
        }

        @JavascriptInterface
        public String searchContacts(String query) {
            return "[]";
        }

        @JavascriptInterface
        public boolean authenticateBiometric(String reason) {
            return true;
        }

        private String guessCategory(String packageName, String label) {
            String lowerPkg = (packageName != null) ? packageName.toLowerCase() : "";
            String lowerLabel = (label != null) ? label.toLowerCase() : "";
            String combined = lowerPkg + " " + lowerLabel;

            if (combined.contains("game") || combined.contains("play.games") || combined.contains("arcade") || combined.contains("puzzle")) {
                return "Games";
            }
            if (combined.contains("whatsapp") || combined.contains("instagram") || combined.contains("facebook") ||
                combined.contains("twitter") || combined.contains("x.corp") || combined.contains("tiktok") ||
                combined.contains("discord") || combined.contains("telegram") || combined.contains("reddit") ||
                combined.contains("snapchat") || combined.contains("signal") || combined.contains("dialer") ||
                combined.contains("contacts") || combined.contains("messaging") || combined.contains("phone")) {
                return "Social";
            }
            if (combined.contains("youtube") || combined.contains("spotify") || combined.contains("netflix") ||
                combined.contains("music") || combined.contains("camera") || combined.contains("gallery") ||
                combined.contains("photos") || combined.contains("vlc") || combined.contains("media") ||
                combined.contains("twitch") || combined.contains("sound") || combined.contains("video")) {
                return "Media";
            }
            if (combined.contains("calendar") || combined.contains("keep") || combined.contains("notes") ||
                combined.contains("docs") || combined.contains("drive") || combined.contains("sheet") ||
                combined.contains("excel") || combined.contains("word") || combined.contains("powerpoint") ||
                combined.contains("office") || combined.contains("notion") || combined.contains("trello") ||
                combined.contains("todo") || combined.contains("task") || combined.contains("gmail") ||
                combined.contains("mail")) {
                return "Productivity";
            }
            return "Tools";
        }

        private String drawableToBase64(Drawable drawable) {
            if (drawable == null) return "";
            try {
                int width = drawable.getIntrinsicWidth();
                int height = drawable.getIntrinsicHeight();
                if (width <= 0 || height <= 0) {
                    width = 96;
                    height = 96;
                } else {
                    width = Math.min(width, 96);
                    height = Math.min(height, 96);
                }

                Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                drawable.draw(canvas);

                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG, 85, stream);
                byte[] byteArray = stream.toByteArray();
                bitmap.recycle();
                return "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP);
            } catch (Throwable t) {
                return "";
            }
        }
    }
}
