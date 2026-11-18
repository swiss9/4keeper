package com.swiss9.fourkeeper;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SystemBarStyle navigationBarStyle = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT)
            : SystemBarStyle.auto(Color.TRANSPARENT, Color.argb(0x66, 0, 0, 0));
        EdgeToEdge.enable(
            this,
            SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle
        );
        registerPlugin(EmbeddedWebViewPlugin.class);
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }
    }
}
