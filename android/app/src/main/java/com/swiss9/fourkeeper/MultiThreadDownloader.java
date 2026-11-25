package com.swiss9.fourkeeper;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Splits one remote file into byte ranges and downloads them in parallel.
 *
 * <p>The engine first probes the server with a {@code HEAD} request. When the
 * response carries {@code Accept-Ranges: bytes} and a usable
 * {@code Content-Length} (verified with a one byte ranged {@code GET}), the
 * file is cut into one chunk per connection and every chunk is fetched with a
 * {@code Range: bytes=start-end} header and written straight into its own
 * offset of the destination file with {@link RandomAccessFile}. Otherwise the
 * engine silently falls back to a single streamed connection, so servers
 * without range support still download normally.</p>
 *
 * <p>Each chunk is retried up to {@value #MAX_RETRIES} times, progress is
 * reported through {@link Listener} at most every few hundred milliseconds,
 * and the partially written file is removed when the download ultimately
 * fails.</p>
 */
public class MultiThreadDownloader {

    /** Receives throttled progress updates. Called from worker threads. */
    public interface Listener {
        void onProgress(long downloadedBytes, long totalBytes);
    }

    private static final int CONNECT_TIMEOUT_MS = 15000;
    private static final int READ_TIMEOUT_MS = 30000;
    private static final int MAX_REDIRECTS = 5;
    /** Retries per chunk after the first attempt. */
    private static final int MAX_RETRIES = 3;
    private static final int BUFFER_SIZE = 32 * 1024;
    private static final long PROGRESS_INTERVAL_MS = 250L;
    /** One writer at a time for the shared resume file. */
    private static final Object STATE_LOCK = new Object();

    private final String url;
    private final File destination;
    private final int connections;
    private final String userAgent;
    private final String cookie;
    private final Listener listener;

    private final AtomicLong downloaded = new AtomicLong(0L);
    private volatile long totalBytes = -1L;
    private volatile long lastProgressAt = 0L;
    private volatile boolean cancelled = false;
    private volatile boolean paused = false;
    /** Bytes already written per chunk, so resume restarts at the right offset. */
    private final Map<Integer, Long> chunkOffsets = new ConcurrentHashMap<>();
    /** Bytes written by the single-stream fallback (used as its Range start). */
    private volatile long streamBytes = 0L;
    /** Resume store: the JSON file and this transfer's id inside it. */
    private File stateStore;
    private long stateId = -1L;
    /** Offsets read back from the store, applied once the server size is known. */
    private JSONArray savedOffsets;
    private long savedTotal = -1L;
    private int savedConnections = 0;
    private long savedStreamBytes = 0L;
    /** A shutdown keeps the partial file so the next launch can continue it. */
    private volatile boolean preservePartial = false;

    public MultiThreadDownloader(
        String url,
        File destination,
        int connections,
        String userAgent,
        String cookie,
        Listener listener
    ) {
        this.url = url == null ? "" : url;
        this.destination = destination;
        this.connections = normalizeConnections(connections);
        this.userAgent = userAgent == null ? "" : userAgent;
        this.cookie = cookie == null ? "" : cookie;
        this.listener = listener;
    }

    /** Clamps any number to the connection counts the UI offers: 1, 4, 8, 16. */
    public static int normalizeConnections(int value) {
        if (value <= 1) return 1;
        if (value <= 4) return 4;
        if (value <= 8) return 8;
        return 16;
    }

    public int getConnections() {
        return connections;
    }

    public long getDownloadedBytes() {
        return downloaded.get();
    }

    public long getTotalBytes() {
        return totalBytes;
    }

    public boolean isCancelled() {
        return cancelled;
    }

    public void cancel() {
        cancelled = true;
    }

    public boolean isPaused() {
        return paused;
    }

    /** Stops the workers where they are; the partial file stays on disk. */
    public void pause() {
        paused = true;
    }

    public void resume() {
        /* A downloader rebuilt after a restart has no offsets in memory yet: read
         * them back so the workers re-issue their Range headers from there. */
        if (chunkOffsets.isEmpty() && streamBytes == 0L) restoreState();
        paused = false;
        saveState();
    }

    /** Stops the workers without discarding the file and saves the offsets. */
    public void suspend() {
        preservePartial = true;
        paused = true;
        saveState();
    }

    /** Blocks the calling transfer thread while paused, cheaply. */
    private void awaitResume() throws IOException {
        while (paused && !cancelled) sleepQuietly(150L);
        if (cancelled) throw new IOException("Cancelled");
    }

    /**
     * Runs the whole transfer on the calling thread and blocks until the file
     * is complete. Call it from a background executor, never from the UI
     * thread.
     */
    public void download() throws IOException {
        if (url.isEmpty()) throw new IOException("No download URL");
        if (destination == null) throw new IOException("No destination file");
        File parent = destination.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs() && !parent.exists()) {
            throw new IOException("Cannot create the download folder");
        }
        emit(downloaded.get(), totalBytes);

        Probe probe = probe();
        if (probe.length > 0) totalBytes = probe.length;
        applySavedState();
        if (downloaded.get() > 0) emit(downloaded.get(), totalBytes);

        boolean completed = false;
        try {
            while (true) {
                if (cancelled) throw new IOException("Cancelled");
                awaitResume();
                try {
                    if (!probe.ranged || connections <= 1 || probe.length <= 0) {
                        downloadSingleStream(probe.url, probe.length);
                    } else {
                        try {
                            downloadInChunks(probe.url, probe.length);
                        } catch (RangeUnsupportedException ignored) {
                            /* Ranges were advertised but a chunk request came back
                             * as a full 200 response. Start over with one link. */
                            downloaded.set(0L);
                            chunkOffsets.clear();
                            streamBytes = 0L;
                            downloadSingleStream(probe.url, probe.length);
                        }
                    }
                    completed = true;
                    break;
                } catch (PausedException pauseSignal) {
                    /* Workers kept the bytes they wrote; hold this thread here
                     * so resume() can restart them from the saved offsets. */
                    saveState();
                    emit(downloaded.get(), totalBytes);
                }
            }
        } finally {
            if (completed) {
                clearState();
            } else if (!preservePartial) {
                deletePartialFile();
                clearState();
            }
        }
    }

    /* ------------------------------------------------------------- probing */

    private Probe probe() throws IOException {
        IOException headError = null;
        String current = url;
        for (int hop = 0; hop <= MAX_REDIRECTS; hop++) {
            HttpURLConnection connection = null;
            try {
                connection = open(current);
                connection.setRequestMethod("HEAD");
                int code = connection.getResponseCode();
                if (isRedirect(code)) {
                    String next = redirectTarget(current, connection);
                    if (next == null) throw new IOException("HTTP " + code);
                    current = next;
                    continue;
                }
                if (code >= 200 && code < 300) {
                    long length = parseLong(connection.getHeaderField("Content-Length"));
                    boolean acceptsRanges = "bytes".equalsIgnoreCase(
                        trim(connection.getHeaderField("Accept-Ranges"))
                    );
                    if (!acceptsRanges || length <= 0) return new Probe(current, length, false);
                    Probe verified = verifyRangeSupport(current);
                    return verified != null ? verified : new Probe(current, length, false);
                }
                headError = new IOException("HTTP " + code);
                break;
            } catch (IOException error) {
                headError = error;
                break;
            } finally {
                if (connection != null) connection.disconnect();
            }
        }
        /* Many CDNs reject HEAD outright (403/405). A one byte ranged GET is
         * the reliable way to learn both the size and range support. */
        Probe ranged = probeWithRangeRequest();
        if (ranged != null) return ranged;
        if (headError != null) throw headError;
        return new Probe(url, -1L, false);
    }

    /** Confirms that a ranged request really returns 206 and a total size. */
    private Probe verifyRangeSupport(String targetUrl) {
        HttpURLConnection connection = null;
        try {
            connection = open(targetUrl);
            connection.setRequestProperty("Range", "bytes=0-0");
            if (connection.getResponseCode() != 206) return null;
            long total = parseContentRangeTotal(connection.getHeaderField("Content-Range"));
            if (total <= 0) return null;
            return new Probe(targetUrl, total, true);
        } catch (Exception error) {
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private Probe probeWithRangeRequest() {
        String current = url;
        for (int hop = 0; hop <= MAX_REDIRECTS; hop++) {
            HttpURLConnection connection = null;
            try {
                connection = open(current);
                connection.setRequestProperty("Range", "bytes=0-0");
                int code = connection.getResponseCode();
                if (isRedirect(code)) {
                    String next = redirectTarget(current, connection);
                    if (next == null) return null;
                    current = next;
                    continue;
                }
                if (code == 206) {
                    long total = parseContentRangeTotal(connection.getHeaderField("Content-Range"));
                    return total > 0 ? new Probe(current, total, true) : null;
                }
                if (code >= 200 && code < 300) {
                    long length = parseLong(connection.getHeaderField("Content-Length"));
                    return new Probe(current, length, false);
                }
                return null;
            } catch (Exception error) {
                return null;
            } finally {
                if (connection != null) connection.disconnect();
            }
        }
        return null;
    }

    /* --------------------------------------------------- parallel transfer */

    private void downloadInChunks(String targetUrl, long total) throws IOException {
        int parts = (int) Math.min(connections, total);
        long chunkSize = (total + parts - 1) / parts;

        /* Reserve the exact size once so every worker can seek to its slice. */
        RandomAccessFile seed = new RandomAccessFile(destination, "rw");
        try {
            seed.setLength(total);
        } finally {
            closeQuietly(seed);
        }

        ExecutorService pool = Executors.newFixedThreadPool(parts);
        List<Future<Void>> futures = new ArrayList<>(parts);
        try {
            for (int index = 0; index < parts; index++) {
                long start = index * chunkSize;
                long end = Math.min(total - 1, start + chunkSize - 1);
                if (start > end) break;
                /* A paused run left this chunk half written: re-request only
                 * the bytes that are still missing. */
                Long saved = chunkOffsets.get(index);
                if (saved != null && saved > start) start = saved;
                if (start > end) continue;
                futures.add(pool.submit(new ChunkTask(targetUrl, index, start, end, total)));
            }
            pool.shutdown();
            while (!pool.awaitTermination(250L, TimeUnit.MILLISECONDS)) {
                if (cancelled) {
                    pool.shutdownNow();
                    throw new IOException("Cancelled");
                }
            }
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            pool.shutdownNow();
            throw new IOException("Interrupted while downloading");
        }

        IOException failure = null;
        for (Future<Void> future : futures) {
            try {
                future.get();
            } catch (CancellationException error) {
                if (failure == null) failure = new IOException("Cancelled");
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                throw new IOException("Interrupted while downloading");
            } catch (ExecutionException error) {
                Throwable cause = error.getCause();
                if (cause instanceof PausedException) throw (PausedException) cause;
                if (cause instanceof RangeUnsupportedException) {
                    throw (RangeUnsupportedException) cause;
                }
                if (failure == null) {
                    failure = cause instanceof IOException
                        ? (IOException) cause
                        : new IOException(String.valueOf(cause));
                }
            }
        }
        if (failure != null) throw failure;
        if (cancelled) throw new IOException("Cancelled");
        if (downloaded.get() < total) throw new IOException("Incomplete download");
        emit(total, total);
    }

    /** Downloads one byte range; each worker owns its own file handle. */
    private final class ChunkTask implements Callable<Void> {
        private final String targetUrl;
        private final int index;
        private final long start;
        private final long end;
        private final long total;

        ChunkTask(String targetUrl, int index, long start, long end, long total) {
            this.targetUrl = targetUrl;
            this.index = index;
            this.start = start;
            this.end = end;
            this.total = total;
        }

        @Override
        public Void call() throws IOException {
            long expected = end - start + 1;
            IOException lastError = null;
            for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                if (cancelled) throw new IOException("Cancelled");
                HttpURLConnection connection = null;
                RandomAccessFile file = null;
                long written = 0L;
                try {
                    connection = open(targetUrl);
                    connection.setRequestProperty("Range", "bytes=" + start + "-" + end);
                    int code = connection.getResponseCode();
                    if (code == 200) throw new RangeUnsupportedException();
                    if (code != 206) throw new IOException("HTTP " + code + " for byte range");

                    file = new RandomAccessFile(destination, "rw");
                    file.seek(start);
                    InputStream input = new BufferedInputStream(connection.getInputStream(), BUFFER_SIZE);
                    byte[] buffer = new byte[BUFFER_SIZE];
                    long position = start;
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        if (cancelled) throw new IOException("Cancelled");
                        if (paused) {
                            chunkOffsets.put(index, position);
                            throw new PausedException();
                        }
                        long room = end - position + 1;
                        if (room <= 0) break;
                        if (read > room) read = (int) room;
                        file.write(buffer, 0, read);
                        position += read;
                        written += read;
                        chunkOffsets.put(index, position);
                        report(downloaded.addAndGet(read), total);
                    }
                    if (position != end + 1) {
                        throw new IOException(
                            "Short range response (" + (position - start) + "/" + expected + ")"
                        );
                    }
                    chunkOffsets.put(index, end + 1);
                    saveState();
                    return null;
                } catch (IOException error) {
                    /* A pause keeps what was written: resume starts from there. */
                    if (error instanceof PausedException) throw error;
                    /* Bytes written by the failed attempt must not be counted
                     * twice once the chunk restarts from its beginning. */
                    downloaded.addAndGet(-written);
                    chunkOffsets.put(index, start);
                    lastError = error;
                    if (error instanceof RangeUnsupportedException) throw error;
                    if (cancelled) throw error;
                    if (attempt >= MAX_RETRIES) throw error;
                    sleepQuietly(350L * (attempt + 1));
                } finally {
                    closeQuietly(file);
                    if (connection != null) connection.disconnect();
                }
            }
            throw lastError == null ? new IOException("Download failed") : lastError;
        }
    }

    /* ------------------------------------------------ single stream fallback */

    private void downloadSingleStream(String targetUrl, long knownTotal) throws IOException {
        HttpURLConnection connection = null;
        InputStream input = null;
        FileOutputStream output = null;
        try {
            long resumeFrom = streamBytes;
            connection = open(targetUrl);
            if (resumeFrom > 0) connection.setRequestProperty("Range", "bytes=" + resumeFrom + "-");
            int code = connection.getResponseCode();
            if (resumeFrom > 0 && code == 200) {
                /* The server ignored the Range header: start over. */
                resumeFrom = 0L;
                streamBytes = 0L;
                connection.disconnect();
                connection = open(targetUrl);
                code = connection.getResponseCode();
            }
            if (code < 200 || code >= 300) throw new IOException("HTTP " + code);
            long total = connection.getContentLengthLong();
            if (total <= 0) total = knownTotal;
            if (resumeFrom > 0 && total > 0) total += resumeFrom;
            if (total <= 0) total = -1L;
            totalBytes = total;

            output = new FileOutputStream(destination, resumeFrom > 0);
            input = new BufferedInputStream(connection.getInputStream(), BUFFER_SIZE);
            byte[] buffer = new byte[BUFFER_SIZE];
            long written = resumeFrom;
            int read;
            while ((read = input.read(buffer)) != -1) {
                if (cancelled) throw new IOException("Cancelled");
                if (paused) {
                    streamBytes = written;
                    throw new PausedException();
                }
                output.write(buffer, 0, read);
                written += read;
                streamBytes = written;
                downloaded.set(written);
                report(written, total);
            }
            output.flush();
            totalBytes = written;
            streamBytes = 0L;
            emit(written, written);
        } finally {
            closeQuietly(input);
            closeQuietly(output);
            if (connection != null) connection.disconnect();
        }
    }

    /* --------------------------------------------------------- resume store */

    /** Binds this transfer to a resume file so a restart can continue it. */
    public void bindState(long id, File store) {
        this.stateId = id;
        this.stateStore = store;
        restoreState();
    }

    /** Serializes url, file, size, connections and the chunk offsets to disk. */
    public void saveState() {
        if (stateStore == null || stateId < 0 || destination == null) return;
        try {
            JSONObject state = new JSONObject();
            state.put("id", stateId);
            state.put("url", url);
            state.put("file", destination.getAbsolutePath());
            state.put("totalBytes", totalBytes);
            state.put("connections", connections);
            state.put("streamBytes", streamBytes);
            JSONArray offsets = new JSONArray();
            int parts = chunkParts(totalBytes);
            for (int index = 0; index < parts; index++) {
                Long position = chunkOffsets.get(index);
                offsets.put(position == null ? 0L : position);
            }
            state.put("offsets", offsets);
            writeState(stateStore, stateId, state);
        } catch (Exception ignored) {
            /* A failed save only costs a restart's worth of progress. */
        }
    }

    /** Forgets this transfer, so a finished file is never offered for resume. */
    public void clearState() {
        clearState(stateStore, stateId);
    }

    /** Drops a saved transfer, e.g. when the user deletes the download. */
    public static void clearState(File store, long id) {
        if (store == null) return;
        synchronized (STATE_LOCK) {
            JSONArray states = readStatesLocked(store);
            JSONArray kept = new JSONArray();
            for (int i = 0; i < states.length(); i++) {
                JSONObject entry = states.optJSONObject(i);
                if (entry == null || entry.optLong("id", -1) == id) continue;
                kept.put(entry);
            }
            writeStatesLocked(store, kept);
        }
    }

    /** Every saved resume point, oldest first. */
    public static JSONArray readStates(File store) {
        if (store == null) return new JSONArray();
        synchronized (STATE_LOCK) {
            return readStatesLocked(store);
        }
    }

    /** Bytes a saved transfer already had on disk. */
    public static long savedBytes(JSONObject state) {
        if (state == null) return 0L;
        long total = state.optLong("totalBytes", -1L);
        long streamed = Math.max(0L, state.optLong("streamBytes", 0L));
        return savedBytes(total, state.optInt("connections", 1), state.optJSONArray("offsets")) + streamed;
    }

    private void restoreState() {
        if (stateStore == null || stateId < 0) return;
        synchronized (STATE_LOCK) {
            JSONArray states = readStatesLocked(stateStore);
            for (int i = 0; i < states.length(); i++) {
                JSONObject entry = states.optJSONObject(i);
                if (entry == null || entry.optLong("id", -1) != stateId) continue;
                savedTotal = entry.optLong("totalBytes", -1L);
                savedConnections = entry.optInt("connections", connections);
                savedOffsets = entry.optJSONArray("offsets");
                savedStreamBytes = Math.max(0L, entry.optLong("streamBytes", 0L));
                downloaded.set(savedBytes(savedTotal, savedConnections, savedOffsets) + savedStreamBytes);
                return;
            }
        }
    }

    /**
     * Turns the saved offsets into live resume points once the server size is
     * known. A different size or connection count means the file changed, so
     * the stale offsets are dropped rather than written at the wrong place.
     */
    private void applySavedState() {
        JSONArray offsets = savedOffsets;
        savedOffsets = null;
        if (offsets == null) return;
        boolean sameFile = savedTotal == totalBytes
            && savedConnections == connections
            && destination != null
            && destination.exists()
            && destination.length() > 0;
        if (!sameFile) {
            chunkOffsets.clear();
            streamBytes = 0L;
            savedStreamBytes = 0L;
            downloaded.set(0L);
            return;
        }
        int parts = chunkParts(totalBytes);
        long chunkSize = parts <= 0 ? 0L : (totalBytes + parts - 1) / parts;
        for (int index = 0; index < offsets.length() && index < parts; index++) {
            long position = offsets.optLong(index, 0L);
            if (position > index * chunkSize) chunkOffsets.put(index, position);
        }
        streamBytes = savedStreamBytes;
        savedStreamBytes = 0L;
        downloaded.set(savedBytes(totalBytes, connections, offsets) + streamBytes);
    }

    private int chunkParts(long total) {
        if (total <= 0) return 0;
        return (int) Math.min(connections, total);
    }

    private static long savedBytes(long total, int connections, JSONArray offsets) {
        if (total <= 0 || offsets == null) return 0L;
        int parts = (int) Math.min(Math.max(connections, 1), total);
        long chunkSize = (total + parts - 1) / parts;
        long written = 0L;
        for (int index = 0; index < offsets.length() && index < parts; index++) {
            long start = index * chunkSize;
            long position = offsets.optLong(index, 0L);
            if (position > start) written += Math.min(position, total) - start;
        }
        return written;
    }

    private static JSONArray readStatesLocked(File store) {
        try (FileInputStream input = new FileInputStream(store)) {
            long size = Math.min(store.length(), 1 << 20);
            if (size <= 0) return new JSONArray();
            byte[] buffer = new byte[(int) size];
            int read = input.read(buffer);
            if (read <= 0) return new JSONArray();
            return new JSONArray(new String(buffer, 0, read, StandardCharsets.UTF_8));
        } catch (Exception error) {
            return new JSONArray();
        }
    }

    private static void writeState(File store, long id, JSONObject state) {
        synchronized (STATE_LOCK) {
            JSONArray states = readStatesLocked(store);
            JSONArray merged = new JSONArray();
            for (int i = 0; i < states.length(); i++) {
                JSONObject entry = states.optJSONObject(i);
                if (entry == null || entry.optLong("id", -1) == id) continue;
                merged.put(entry);
            }
            merged.put(state);
            writeStatesLocked(store, merged);
        }
    }

    private static void writeStatesLocked(File store, JSONArray states) {
        try (FileOutputStream output = new FileOutputStream(store)) {
            output.write(states.toString().getBytes(StandardCharsets.UTF_8));
        } catch (Exception ignored) {
        }
    }

    /* ------------------------------------------------------------- plumbing */

    private HttpURLConnection open(String targetUrl) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(targetUrl).openConnection();
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        connection.setInstanceFollowRedirects(true);
        connection.setUseCaches(false);
        /* Byte ranges only line up when the body is not re-compressed. */
        connection.setRequestProperty("Accept-Encoding", "identity");
        if (!userAgent.isEmpty()) connection.setRequestProperty("User-Agent", userAgent);
        if (!cookie.isEmpty()) connection.setRequestProperty("Cookie", cookie);
        return connection;
    }

    private void report(long bytes, long total) {
        long now = System.currentTimeMillis();
        if (now - lastProgressAt < PROGRESS_INTERVAL_MS) return;
        lastProgressAt = now;
        emit(bytes, total);
    }

    private void emit(long bytes, long total) {
        if (listener == null) return;
        try {
            listener.onProgress(bytes, total);
        } catch (Exception ignored) {
        }
    }

    private void deletePartialFile() {
        try {
            if (destination != null && destination.exists()) destination.delete();
        } catch (Exception ignored) {
        }
    }

    private static boolean isRedirect(int code) {
        return code == 301 || code == 302 || code == 303 || code == 307 || code == 308;
    }

    private static String redirectTarget(String currentUrl, HttpURLConnection connection) {
        String location = connection.getHeaderField("Location");
        if (location == null || location.isEmpty()) return null;
        try {
            return new URL(new URL(currentUrl), location).toString();
        } catch (Exception error) {
            return null;
        }
    }

    private static long parseContentRangeTotal(String header) {
        if (header == null) return -1L;
        int slash = header.lastIndexOf('/');
        if (slash < 0 || slash == header.length() - 1) return -1L;
        String total = header.substring(slash + 1).trim();
        if ("*".equals(total)) return -1L;
        return parseLong(total);
    }

    private static long parseLong(String value) {
        if (value == null) return -1L;
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException error) {
            return -1L;
        }
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
        }
    }

    private static void closeQuietly(java.io.Closeable closeable) {
        if (closeable == null) return;
        try {
            closeable.close();
        } catch (Exception ignored) {
        }
    }

    /** Server sizes and range support discovered before the transfer. */
    private static final class Probe {
        final String url;
        final long length;
        final boolean ranged;

        Probe(String url, long length, boolean ranged) {
            this.url = url;
            this.length = length;
            this.ranged = ranged;
        }
    }

    /** Internal signal: the transfer stopped on pause, not on failure. */
    static final class PausedException extends IOException {
        PausedException() {
            super("Paused");
        }
    }

    /** Raised when a server that advertised ranges answers a full 200 body. */
    static final class RangeUnsupportedException extends IOException {
        RangeUnsupportedException() {
            super("Server ignored the requested byte range");
        }
    }
}
