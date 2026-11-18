package com.swiss9.fourkeeper;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        registerPlugin(EmbeddedWebViewPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
