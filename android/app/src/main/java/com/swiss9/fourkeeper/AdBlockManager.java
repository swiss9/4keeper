package com.swiss9.fourkeeper;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

/**
 * Hosts-file ad blocking: downloads the lists the user enabled, keeps the union
 * in memory and caches it in {@code adblock_hosts.txt}.
 *
 * <p>Network and disk work only happens in {@link #updateLists(List)}, which
 * blocks and therefore belongs on a background thread. {@link #isBlocked} is
 * called from the WebView IO thread and only touches the in-memory set.</p>
 */
public class AdBlockManager {

    private static final String FILE_NAME = "adblock_hosts.txt";
    private static final int CONNECT_TIMEOUT_MS = 15000;
    private static final int READ_TIMEOUT_MS = 20000;
    private static final String USER_AGENT = "Mozilla/5.0 (Linux; Android 14) 4Keeper/1.0";

    private final File hostsFile;
    private final HashSet<String> blockedHosts = new HashSet<>();
    private final List<String> enabledListUrls = new ArrayList<>();
    private boolean loaded = false;

    public AdBlockManager(File directory) {
        this.hostsFile = new File(directory, FILE_NAME);
    }

    /** Reads the cached hosts once; safe to call on every app boot. */
    public synchronized void loadListsFromDisk() {
        if (loaded) return;
        loaded = true;
        if (!hostsFile.exists()) return;
        try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(new FileInputStream(hostsFile), "UTF-8"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String host = normalize(line);
                if (host != null) blockedHosts.add(host);
            }
        } catch (Exception ignored) {
        }
    }

    public synchronized int size() {
        return blockedHosts.size();
    }

    public synchronized List<String> getEnabledListUrls() {
        return new ArrayList<>(enabledListUrls);
    }

    /** True for the host and any parent domain listed in a hosts file. */
    public synchronized boolean isBlocked(String host) {
        if (host == null) return false;
        String lower = host.toLowerCase(Locale.US);
        int start = 0;
        while (start < lower.length()) {
            if (blockedHosts.contains(lower.substring(start))) return true;
            int dot = lower.indexOf('.', start);
            if (dot < 0) break;
            start = dot + 1;
        }
        return false;
    }

    /**
     * Downloads every list, replaces the cached hosts with their union and
     * writes the cache to disk. Blocks; call from a background thread. Returns
     * the number of hosts now active, or 0 when no list could be fetched.
     */
    public int updateLists(List<String> urls) {
        List<String> targets = new ArrayList<>();
        if (urls != null) {
            for (String url : urls) {
                if (url != null && !url.trim().isEmpty()) targets.add(url.trim());
            }
        }
        synchronized (this) {
            enabledListUrls.clear();
            enabledListUrls.addAll(targets);
        }
        HashSet<String> fresh = new HashSet<>();
        for (String url : targets) {
            try {
                fresh.addAll(download(url));
            } catch (Exception ignored) {
            }
        }
        if (fresh.isEmpty()) return size();
        synchronized (this) {
            blockedHosts.clear();
            blockedHosts.addAll(fresh);
        }
        save(fresh);
        return fresh.size();
    }

    private HashSet<String> download(String url) throws IOException {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(READ_TIMEOUT_MS);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("User-Agent", USER_AGENT);
            int code = connection.getResponseCode();
            if (code < 200 || code >= 300) throw new IOException("HTTP " + code);
            HashSet<String> hosts = new HashSet<>();
            try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(connection.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String host = normalize(line);
                    if (host != null) hosts.add(host);
                }
            }
            return hosts;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    /* Accepts both hosts syntax ("0.0.0.0 ads.example.com") and plain domain
     * lists, and rejects comments, IPs and local-only names. */
    private static String normalize(String line) {
        if (line == null) return null;
        String text = line.trim();
        if (text.isEmpty() || text.startsWith("#") || text.startsWith("!")) return null;
        int comment = text.indexOf('#');
        if (comment >= 0) text = text.substring(0, comment).trim();
        String[] parts = text.split("\\s+");
        if (parts.length == 0) return null;
        String host;
        if (parts.length >= 2) {
            String address = parts[0];
            boolean sinkhole = "0.0.0.0".equals(address) || "127.0.0.1".equals(address)
                || "::1".equals(address) || "::".equals(address);
            if (!sinkhole) return null;
            host = parts[1];
        } else {
            host = parts[0];
        }
        host = host.toLowerCase(Locale.US);
        if (host.isEmpty() || host.indexOf('.') < 0) return null;
        if (host.contains("/") || host.contains(":") || host.contains("*")) return null;
        if (host.equals("localhost") || host.endsWith(".local") || host.endsWith(".localhost")) return null;
        if (host.matches("[0-9.]+")) return null;
        return host;
    }

    /* Written to a temporary file first, so a failed update can never leave a
     * half-written cache behind. */
    private void save(HashSet<String> hosts) {
        File temp = new File(hostsFile.getParentFile(), FILE_NAME + ".tmp");
        try (BufferedWriter writer = new BufferedWriter(
            new OutputStreamWriter(new FileOutputStream(temp), "UTF-8"))) {
            for (String host : hosts) {
                writer.write(host);
                writer.newLine();
            }
        } catch (Exception error) {
            temp.delete();
            return;
        }
        if (!temp.renameTo(hostsFile)) {
            hostsFile.delete();
            temp.renameTo(hostsFile);
        }
    }
}
