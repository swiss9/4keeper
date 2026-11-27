package com.swiss9.fourkeeper;

import android.app.Activity;
import android.app.PictureInPictureParams;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Rational;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;

/**
 * Full-screen ExoPlayer surface opened from the in-page media sniffer.
 *
 * <p>The player itself lives in {@link MediaPlaybackService}: this activity binds
 * to it and attaches its {@link PlayerView}, so the audio keeps going when the
 * window is destroyed or the app is minimized. Entering picture-in-picture is
 * still automatic.</p>
 */
public class VideoPlayerActivity extends Activity {

    public static final String EXTRA_URL = "url";
    public static final String EXTRA_KIND = "kind";
    /** Set by the sniffer's Play button: open straight into the floating window. */
    public static final String EXTRA_PIP = "pip";

    private ExoPlayer player;
    private PlayerView playerView;
    private FrameLayout root;
    private boolean pipOnStart;
    private boolean bound;
    private String mediaUrl;

    private final Player.Listener errorListener = new Player.Listener() {
        @Override
        public void onPlayerError(PlaybackException error) {
            showError();
        }
    };

    private final ServiceConnection connection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            bound = true;
            attach(((MediaPlaybackService.LocalBinder) binder).getService().getPlayer());
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            bound = false;
        }
    };

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
        mediaUrl = url;
        pipOnStart = intent.getBooleanExtra(EXTRA_PIP, false);

        /* The player belongs to the service, so the service is what keeps the
         * audio alive; this activity only attaches to it. */
        MediaPlaybackService.start(this);
        try {
            bindService(new Intent(this, MediaPlaybackService.class), connection,
                Context.BIND_AUTO_CREATE);
        } catch (Exception ignored) {
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            updatePipParams(false);
        }
    }

    /* Attaches the service-owned player. Re-attaching to the same media keeps
     * its position instead of restarting the video. */
    private void attach(ExoPlayer servicePlayer) {
        if (servicePlayer == null || isFinishing() || isDestroyed()) return;
        player = servicePlayer;
        playerView.setPlayer(player);
        player.addListener(errorListener);
        MediaItem current = player.getCurrentMediaItem();
        if (current == null || !mediaUrl.equals(current.mediaId)) {
            player.stop();
            player.setMediaItem(MediaItem.fromUri(mediaUrl));
            player.prepare();
        }
        player.setPlayWhenReady(true);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!pipOnStart) return;
        pipOnStart = false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        try {
            enterPictureInPictureMode(buildPipParams(false));
        } catch (Exception ignored) {
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
            setPictureInPictureParams(buildPipParams(autoEnter));
        } catch (Exception ignored) {
        }
    }

    private PictureInPictureParams buildPipParams(boolean autoEnter) {
        PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
        builder.setAspectRatio(pipRatio());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setAutoEnterEnabled(autoEnter);
        }
        return builder.build();
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
        /* Detach the surface but never release the player here: the service
         * owns it and keeps playing. */
        if (player != null) {
            player.removeListener(errorListener);
            player = null;
        }
        if (playerView != null) {
            playerView.setPlayer(null);
        }
        if (bound) {
            try {
                unbindService(connection);
            } catch (Exception ignored) {
            }
            bound = false;
        }
        /* Closed by the user: stop. Destroyed by the system while the app went
         * to the background: leave the service playing. */
        if (isFinishing()) {
            MediaPlaybackService.stop(this);
        }
        super.onDestroy();
    }
}
