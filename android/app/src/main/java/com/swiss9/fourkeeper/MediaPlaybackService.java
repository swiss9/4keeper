package com.swiss9.fourkeeper;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;

/**
 * Owns the ExoPlayer that {@link VideoPlayerActivity} displays and keeps it
 * running in the foreground, so audio continues after the activity is destroyed
 * or the app is minimized.
 *
 * <p>The player belongs to this service: an activity binds, calls
 * {@link #getPlayer()} and attaches its surface. Releasing the window therefore
 * no longer stops playback, and the MediaSession stays published.</p>
 */
public class MediaPlaybackService extends Service {

    /** Notification action: stops playback and drops the notification. */
    public static final String ACTION_STOP = "com.swiss9.fourkeeper.STOP_PLAYBACK";

    private static final String CHANNEL_ID = "media_playback";
    private static final int NOTIFICATION_ID = 4104;

    private final LocalBinder binder = new LocalBinder();
    private ExoPlayer player;
    private MediaSession session;

    /** Hands a bound activity the service, and with it the player. */
    public class LocalBinder extends Binder {
        public MediaPlaybackService getService() {
            return MediaPlaybackService.this;
        }
    }

    /** The single player this service owns, created on first use. */
    public ExoPlayer getPlayer() {
        if (player == null) {
            /* Application context: the player must not hold the activity that
             * happened to start it. */
            player = new ExoPlayer.Builder(getApplicationContext()).build();
            player.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .build(),
                true
            );
            player.addListener(new Player.Listener() {
                @Override
                public void onPlaybackStateChanged(int state) {
                    /* Nothing left to play: drop the notification. The player
                     * itself is released in onDestroy(), which only runs once
                     * no activity is bound to it. */
                    if (state == Player.STATE_ENDED) {
                        stopForegroundNow();
                        stopSelf();
                    }
                }
            });
        }
        return player;
    }

    /** Starts or refreshes the foreground service. */
    public static void start(Context context) {
        Intent intent = new Intent(context, MediaPlaybackService.class);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        } catch (Exception ignored) {
        }
    }

    /** Drops the session, the player and the notification when playback is over. */
    public static void stop(Context context) {
        try {
            context.stopService(new Intent(context, MediaPlaybackService.class));
        } catch (Exception ignored) {
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            if (player != null) player.pause();
            stopForegroundNow();
            stopSelf();
            return START_NOT_STICKY;
        }
        ExoPlayer active = getPlayer();
        if (session == null) {
            try {
                session = new MediaSession.Builder(this, active)
                    .setSessionActivity(openApp())
                    .build();
            } catch (Exception ignored) {
                /* No session is still better than no service: the audio keeps
                 * playing, only the lock-screen controls are missing. */
            }
        }
        goForeground();
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void onDestroy() {
        if (session != null) {
            try {
                session.release();
            } catch (Exception ignored) {
            }
            session = null;
        }
        if (player != null) {
            try {
                player.release();
            } catch (Exception ignored) {
            }
            player = null;
        }
        super.onDestroy();
    }

    private void stopForegroundNow() {
        try {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } catch (Exception ignored) {
        }
    }

    private void goForeground() {
        Notification notification = buildNotification();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception ignored) {
        }
    }

    private Notification buildNotification() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager != null) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW);
            channel.setShowBadge(false);
            manager.createNotificationChannel(channel);
        }
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Playing")
            .setContentText("4Keeper is playing media")
            .setContentIntent(openApp())
            /* Without this the player can keep audio going with no way to stop
             * it once the video window is gone. */
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPlayback())
            .setOngoing(true)
            .setSilent(true)
            .setStyle(mediaStyle())
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build();
    }

    /* MediaStyle is what makes Android treat the foreground service as a media
     * session: without it the notification is not a media control and playback
     * is torn down as soon as the app leaves the foreground. */
    private MediaStyle mediaStyle() {
        MediaStyle style = new MediaStyle().setShowActionsInCompactView(0);
        try {
            if (session != null) style.setMediaSession(session.getSessionCompatToken());
        } catch (Exception ignored) {
            /* No token only costs the lock-screen controls. */
        }
        return style;
    }

    /* Brings the app forward rather than opening a player with no URL. */
    private PendingIntent openApp() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(this, 0, intent, flags);
    }

    private PendingIntent stopPlayback() {
        Intent intent = new Intent(this, MediaPlaybackService.class);
        intent.setAction(ACTION_STOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getService(this, 1, intent, flags);
    }
}
