package com.lokychat.app;

import com.android.billingclient.api.AcknowledgePurchaseResponseListener;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Google Play Billing bridge for consumable gem packs.
 * Products must exist in Play Console as one-time products (gems_1000, gems_3000, ...).
 *
 * Flow: purchase() -> Play purchase sheet -> resolves with purchase info.
 * The web layer grants gems, remembers the token, then calls consume().
 * getUnconsumedPurchases() lets the web layer recover purchases if the app closed mid-flow.
 */
@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billingClient;
    private final Map<String, ProductDetails> productCache = new HashMap<>();
    private PluginCall pendingPurchaseCall;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .build();
    }

    private interface Ready { void run(); }

    private void withConnection(PluginCall call, Ready onReady) {
        if (billingClient.isReady()) {
            onReady.run();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    onReady.run();
                } else {
                    call.reject("Billing unavailable: " + result.getDebugMessage(), String.valueOf(result.getResponseCode()));
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Next call will reconnect.
            }
        });
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        JSArray ids = call.getArray("productIds");
        if (ids == null) {
            call.reject("productIds required");
            return;
        }
        withConnection(call, () -> {
            List<QueryProductDetailsParams.Product> products = new ArrayList<>();
            try {
                for (Object id : ids.toList()) {
                    products.add(QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(String.valueOf(id))
                            .setProductType(BillingClient.ProductType.INAPP)
                            .build());
                }
            } catch (Exception e) {
                call.reject("Invalid productIds");
                return;
            }
            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder().setProductList(products).build();
            billingClient.queryProductDetailsAsync(params, (billingResult, queryResult) -> {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("Query failed: " + billingResult.getDebugMessage(), String.valueOf(billingResult.getResponseCode()));
                    return;
                }
                JSArray out = new JSArray();
                for (ProductDetails pd : queryResult.getProductDetailsList()) {
                    productCache.put(pd.getProductId(), pd);
                    JSObject item = new JSObject();
                    item.put("productId", pd.getProductId());
                    item.put("title", pd.getName());
                    ProductDetails.OneTimePurchaseOfferDetails offer = pd.getOneTimePurchaseOfferDetails();
                    if (offer != null) {
                        item.put("price", offer.getFormattedPrice());
                        item.put("priceMicros", offer.getPriceAmountMicros());
                        item.put("currency", offer.getPriceCurrencyCode());
                    }
                    out.put(item);
                }
                JSObject ret = new JSObject();
                ret.put("products", out);
                call.resolve(ret);
            });
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null) {
            call.reject("productId required");
            return;
        }
        if (pendingPurchaseCall != null) {
            call.reject("Another purchase is in progress");
            return;
        }
        withConnection(call, () -> {
            ProductDetails pd = productCache.get(productId);
            if (pd == null) {
                call.reject("Product not loaded: " + productId);
                return;
            }
            BillingFlowParams.ProductDetailsParams pdp = BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(pd)
                    .build();
            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(pdp))
                    .build();
            call.setKeepAlive(true);
            pendingPurchaseCall = call;
            getActivity().runOnUiThread(() -> {
                BillingResult result = billingClient.launchBillingFlow(getActivity(), flowParams);
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    finishPending(null, "Launch failed: " + result.getDebugMessage(), result.getResponseCode());
                }
            });
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase p : purchases) {
                JSObject data = purchaseToJs(p);
                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    finishPending(data, null, code);
                } else if (p.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                    data.put("pending", true);
                    finishPending(data, null, code);
                }
            }
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            finishPending(null, "USER_CANCELED", code);
        } else {
            finishPending(null, "Purchase failed: " + result.getDebugMessage(), code);
        }
    }

    private void finishPending(JSObject data, String error, int code) {
        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;
        if (call == null) {
            // Purchase arrived without an active call (e.g. pending payment completed later).
            if (data != null) notifyListeners("purchaseUpdated", data);
            return;
        }
        call.setKeepAlive(false);
        if (data != null) {
            call.resolve(data);
        } else {
            call.reject(error, String.valueOf(code));
        }
        getBridge().releaseCall(call);
    }

    private JSObject purchaseToJs(Purchase p) {
        JSObject data = new JSObject();
        List<String> products = p.getProducts();
        data.put("productId", products.isEmpty() ? "" : products.get(0));
        data.put("purchaseToken", p.getPurchaseToken());
        data.put("orderId", p.getOrderId());
        data.put("purchased", p.getPurchaseState() == Purchase.PurchaseState.PURCHASED);
        return data;
    }

    @PluginMethod
    public void consume(PluginCall call) {
        String token = call.getString("purchaseToken");
        if (token == null) {
            call.reject("purchaseToken required");
            return;
        }
        withConnection(call, () -> {
            ConsumeParams params = ConsumeParams.newBuilder().setPurchaseToken(token).build();
            billingClient.consumeAsync(params, (billingResult, purchaseToken) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    call.resolve();
                } else {
                    call.reject("Consume failed: " + billingResult.getDebugMessage(), String.valueOf(billingResult.getResponseCode()));
                }
            });
        });
    }

    @PluginMethod
    public void getUnconsumedPurchases(PluginCall call) {
        withConnection(call, () -> {
            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build();
            billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("Query purchases failed: " + billingResult.getDebugMessage());
                    return;
                }
                JSArray out = new JSArray();
                for (Purchase p : purchases) {
                    if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                        out.put(purchaseToJs(p));
                    }
                }
                JSObject ret = new JSObject();
                ret.put("purchases", out);
                call.resolve(ret);
            });
        });
    }
}
