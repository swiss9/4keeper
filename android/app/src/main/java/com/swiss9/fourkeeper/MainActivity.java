package com.swiss9.fourkeeper;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EmbeddedWebViewPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
