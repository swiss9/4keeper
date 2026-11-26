package com.swiss9.fourkeeper;

import android.app.Activity;
import android.app.PictureInPictureParams;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;

/**
 * Full-screen ExoPlayer surface opened from the in-page media sniffer.
 *
 * <p>Entering picture-in-picture is automatic: Home (or the PiP gesture) shrinks
 * the player instead of stopping playback. The player is released only in
 * {@link #onDestroy()}, which PiP never triggers.</p>
 */
public class VideoPlayerActivity extends Activity {

    public static final String EXTRA_URL = "url";
    public static final String EXTRA_KIND = "kind";

    private ExoPlayer player;
    private PlayerView playerView;
    private FrameLayout root;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        playerView = new PlayerView(this);
        playerView.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        root.addView(playerView);
        setContentView(root);

        Intent intent = getIntent();
        String url = intent == null ? null : intent.getStringExtra(EXTRA_URL);
        if (url == null || url.isEmpty()) {
            finish();
            return;
        }

        player = new ExoPlayer.Builder(this).build();
        player.setAudioAttributes(
            new AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                .build(),
            true
        );
        player.addListener(new Player.Listener() {
            @Override
            public void onPlayerError(PlaybackException error) {
                showError();
            }
        });
        playerView.setPlayer(player);
        player.setMediaItem(MediaItem.fromUri(url));
        player.prepare();
        player.setPlayWhenReady(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            updatePipParams(false);
        }
    }

    private void showError() {
        if (root == null || isFinishing()) return;
        Toast.makeText(this, "This file cannot be played here", Toast.LENGTH_SHORT).show();
        TextView message = new TextView(this);
        message.setText("This file cannot be played here.\nTry downloading it instead.");
        message.setTextColor(Color.parseColor("#a1a1aa"));
        message.setTextSize(14f);
        message.setGravity(Gravity.CENTER);
        message.setPadding(48, 48, 48, 48);
        root.addView(message, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
    }

    /* The PiP window keeps the video's own aspect ratio, clamped to the range
     * Android accepts, and auto-enter is set on S+ so Home shrinks it. */
    private void updatePipParams(boolean autoEnter) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        try {
            PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
            builder.setAspectRatio(pipRatio());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                builder.setAutoEnterEnabled(autoEnter);
            }
            setPictureInPictureParams(builder.build());
        } catch (Exception ignored) {
        }
    }

    private Rational pipRatio() {
        int width = player == null ? 0 : player.getVideoSize().width;
        int height = player == null ? 0 : player.getVideoSize().height;
        if (width <= 0 || height <= 0) return new Rational(16, 9);
        if (width > height * 2.39f) width = Math.round(height * 2.39f);
        if (height > width * 2.39f) height = Math.round(width * 2.39f);
        return new Rational(Math.max(1, width), Math.max(1, height));
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || isInPictureInPictureMode()) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                updatePipParams(true);
            } else {
                updatePipParams(false);
                enterPictureInPictureMode();
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        if (playerView != null) playerView.setUseController(!isInPictureInPictureMode);
    }

    @Override
    protected void onPause() {
        super.onPause();
        /* Auto-enter must be armed before the activity leaves the foreground. */
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !isFinishing()) {
            updatePipParams(true);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (player != null) {
            player.release();
            player = null;
        }
        if (playerView != null) {
            playerView.setPlayer(null);
            playerView = null;
        }
    }
}
