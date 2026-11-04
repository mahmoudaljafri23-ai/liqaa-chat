package com.lokychat.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSIONS_REQUEST_CODE = 101;
    private static final String NOTIFICATION_CHANNEL_ID = "lokychat_channel_main";
    private LocationManager locationManager;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PlayBillingPlugin.class);
        super.onCreate(savedInstanceState);
        createNotificationChannel();
        initFirebaseMessaging();
        setupWebViewGeoAndBridge();
        requestAppPermissions();
    }

    private void initFirebaseMessaging() {
        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().subscribeToTopic("all_users")
                .addOnCompleteListener(task -> {
                    android.util.Log.d("LokyFCM", "Subscribed to all_users: " + task.isSuccessful());
                });
            com.google.firebase.messaging.FirebaseMessaging.getInstance().subscribeToTopic("broadcast");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "إشعارات لوكي شات";
            String description = "تنبيهات الرسائل والاتصالات والمطابقات الفورية";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.enableLights(true);
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    public void triggerNativeNotification(String title, String message) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    return;
                }
            }

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                (int) (System.currentTimeMillis() % 10000),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
            notificationManager.notify((int) (System.currentTimeMillis() % 100000), builder.build());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "(function() { return (typeof window.handleAppBackButton === 'function') ? window.handleAppBackButton() : false; })();",
                result -> {
                    if ("true".equals(result)) {
                        return;
                    }
                    runOnUiThread(() -> moveTaskToBack(true));
                }
            );
        } else {
            moveTaskToBack(true);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        setupWebViewGeoAndBridge();
        detectAndSendLocation();
        runOnUiThread(() -> {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript("if (window.initWelcomeCamera) window.initWelcomeCamera();", null);
            }
        });
    }

    private void setupWebViewGeoAndBridge() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                WebSettings settings = webView.getSettings();
                settings.setGeolocationEnabled(true);
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);

                webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                    @Override
                    public android.graphics.Bitmap getDefaultVideoPoster() {
                        return android.graphics.Bitmap.createBitmap(1, 1, android.graphics.Bitmap.Config.ARGB_8888);
                    }

                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        runOnUiThread(() -> {
                            try {
                                request.grant(request.getResources());
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        });
                    }
                });

                webView.addJavascriptInterface(new Object() {
                    @JavascriptInterface
                    public void requestNativeLocation() {
                        runOnUiThread(() -> detectAndSendLocation());
                    }

                    @JavascriptInterface
                    public void showNativeNotification(String title, String message) {
                        runOnUiThread(() -> triggerNativeNotification(title, message));
                    }

                    @JavascriptInterface
                    public boolean isNotificationPermissionGranted() {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            return ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
                        }
                        return true;
                    }

                    @JavascriptInterface
                    public void minimizeApp() {
                        runOnUiThread(() -> moveTaskToBack(true));
                    }

                    @JavascriptInterface
                    public void requestNotificationPermissionNative() {
                        runOnUiThread(() -> {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSIONS_REQUEST_CODE);
                            }
                        });
                    }
                }, "AndroidBridge");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void requestAppPermissions() {
        List<String> permissions = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECORD_AUDIO);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        if (!permissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), PERMISSIONS_REQUEST_CODE);
        } else {
            detectAndSendLocation();
            runOnUiThread(() -> {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript("if (window.initWelcomeCamera) window.initWelcomeCamera();", null);
                }
            });
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSIONS_REQUEST_CODE) {
            detectAndSendLocation();
            runOnUiThread(() -> {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript("if (window.initWelcomeCamera) window.initWelcomeCamera();", null);
                }
            });
        }
    }

    @SuppressLint("MissingPermission")
    private void detectAndSendLocation() {
        try {
            boolean hasFine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            boolean hasCoarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;

            if (!hasFine && !hasCoarse) {
                return;
            }

            if (locationManager == null) {
                locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            }

            Location bestLocation = null;
            if (locationManager != null) {
                if (hasFine && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    bestLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                }
                if (bestLocation == null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    bestLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                }
                if (bestLocation == null && locationManager.isProviderEnabled(LocationManager.PASSIVE_PROVIDER)) {
                    bestLocation = locationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
                }
            }

            if (bestLocation != null) {
                processAndSendLocation(bestLocation.getLatitude(), bestLocation.getLongitude());
            } else if (locationManager != null) {
                String provider = hasFine && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
                        ? LocationManager.GPS_PROVIDER
                        : LocationManager.NETWORK_PROVIDER;

                locationManager.requestSingleUpdate(provider, new LocationListener() {
                    @Override
                    public void onLocationChanged(@NonNull Location location) {
                        processAndSendLocation(location.getLatitude(), location.getLongitude());
                    }
                    @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
                    @Override public void onProviderEnabled(@NonNull String provider) {}
                    @Override public void onProviderDisabled(@NonNull String provider) {}
                }, null);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void processAndSendLocation(double lat, double lon) {
        new Thread(() -> {
            try {
                Geocoder geocoder = new Geocoder(MainActivity.this, new Locale("ar"));
                List<Address> addresses = geocoder.getFromLocation(lat, lon, 1);
                String countryCode = "";
                String countryName = "";

                if (addresses != null && !addresses.isEmpty()) {
                    Address address = addresses.get(0);
                    countryCode = address.getCountryCode();
                    countryName = address.getCountryName();
                }

                final String finalCode = (countryCode != null) ? countryCode.toUpperCase() : "";
                final String finalName = (countryName != null) ? countryName : "";
                final double finalLat = lat;
                final double finalLon = lon;

                runOnUiThread(() -> {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        String js = String.format(
                            "if (window.onNativeLocationDetected) { window.onNativeLocationDetected('%s', '%s', %f, %f); }",
                            finalCode, finalName.replace("'", "\\'"), finalLat, finalLon
                        );
                        getBridge().getWebView().evaluateJavascript(js, null);
                    }
                });
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }
}
