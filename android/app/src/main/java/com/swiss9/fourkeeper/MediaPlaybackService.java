package com.swiss9.fourkeeper;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;
import androidx.media3.common.Player;
import androidx.media3.session.MediaSession;

/**
 * Foreground service that keeps the playing video's process alive and its
 * MediaSession published, so audio keeps going when the user switches apps.
 *
 * <p>The player stays owned by {@link VideoPlayerActivity}: the service only
 * wraps it in a session and holds a reference while playback runs. The activity
 * releases the session and the player on the way out, in that order.</p>
 */
public class MediaPlaybackService extends Service {

    private static final String CHANNEL_ID = "media_playback";
    private static final int NOTIFICATION_ID = 4104;

    /** Set before startService(); cleared by {@link #stop(Context)}. */
    private static Player sharedPlayer;

    private MediaSession session;

    /** Starts or refreshes the foreground service for a player that is playing. */
    public static void start(Activity activity, Player player) {
        sharedPlayer = player;
        Intent intent = new Intent(activity, MediaPlaybackService.class);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                activity.startForegroundService(intent);
            } else {
                activity.startService(intent);
            }
        } catch (Exception ignored) {
        }
    }

    /** Drops the session and the notification when playback is over. */
    public static void stop(Context context) {
        sharedPlayer = null;
        try {
            context.stopService(new Intent(context, MediaPlaybackService.class));
        } catch (Exception ignored) {
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Player player = sharedPlayer;
        if (player == null) {
            /* A system restart has no player to attach to, but the service was
             * started with startForegroundService and must go foreground once
             * or the process is killed. */
            goForeground();
            stopSelf();
            return START_NOT_STICKY;
        }
        if (session == null) {
            try {
                session = new MediaSession.Builder(this, player)
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
    public void onDestroy() {
        if (session != null) {
            try {
                session.release();
            } catch (Exception ignored) {
            }
            session = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
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
            .setOngoing(true)
            .setSilent(true)
            .build();
    }

    /* Brings the app forward rather than opening a player with no URL. */
    private PendingIntent openApp() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(this, 0, intent, flags);
    }
}
