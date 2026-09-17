package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.exception.InvalidPosterException;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.config.ConnectionConfig;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.http.ClassicHttpResponse;
import org.apache.hc.core5.util.Timeout;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Locale;

@Service
public class PosterStorageService {
    public static final int MAX_BYTES = 256 * 1024;

    /** The returned data URL contains the image itself and is persisted in movies.poster_url. */
    public String store(String source) {
        if (source == null || source.isBlank()) return null;
        String value = source.trim();
        try {
            if (value.regionMatches(true, 0, "data:", 0, 5)) {
                int comma = value.indexOf(',');
                if (comma < 0 || value.length() > 350000) throw new InvalidPosterException("Invalid poster image data");
                byte[] bytes = Base64.getDecoder().decode(value.substring(comma + 1));
                String image = encode(bytes);
                if (!image.substring(0, image.indexOf(',')).equalsIgnoreCase(value.substring(0, comma))) {
                    throw new InvalidPosterException("Poster image type does not match its contents");
                }
                return image;
            }
            return download(URI.create(value));
        } catch (IOException | IllegalArgumentException exception) {
            throw new InvalidPosterException("Could not download or read poster. Use a public PNG, JPEG, or WebP image up to 256 KB, or upload the image directly.");
        }
    }

    String download(URI uri) throws IOException {
        try (CloseableHttpClient client = createClient()) {
            for (int redirect = 0; redirect <= 3; redirect++) {
                validateUrl(uri);
                // IP literals can bypass the client's DNS resolver, so validate these separately.
                String host = uri.getHost();
                if (host.contains(":") || host.matches("[0-9.]+")) new PublicPosterDnsResolver().resolve(host);
                HttpGet request = new HttpGet(uri);
                request.setHeader("Accept", "image/png,image/jpeg,image/webp");
                request.setHeader("User-Agent", "Framebase/1.0");
                // An absolute request deadline also bounds servers that trickle their response body.
                try (var timer = java.util.concurrent.Executors.newSingleThreadScheduledExecutor()) {
                    var deadline = timer.schedule(request::cancel, 15, java.util.concurrent.TimeUnit.SECONDS);
                    try {
                        Download result;
                        try (var response = client.executeOpen(null, request, null)) {
                            try {
                                result = readResponse(response);
                            } finally {
                                // Do not drain an untrusted oversized/redirect response body on close.
                                request.cancel();
                            }
                        }
                        if (result.location() == null) return encode(result.bytes());
                        uri = uri.resolve(result.location());
                    } finally {
                        deadline.cancel(false);
                    }
                }
            }
            throw new InvalidPosterException("Poster URL redirected too many times");
        }
    }

    CloseableHttpClient createClient() {
        return HttpClients.custom()
                .setConnectionManager(PoolingHttpClientConnectionManagerBuilder.create()
                        .setDnsResolver(new PublicPosterDnsResolver())
                        .setDefaultConnectionConfig(ConnectionConfig.custom()
                                .setConnectTimeout(Timeout.ofSeconds(5)).setSocketTimeout(Timeout.ofSeconds(10)).build())
                        .build())
                .setDefaultRequestConfig(RequestConfig.custom().setResponseTimeout(Timeout.ofSeconds(10)).build())
                .disableAutomaticRetries().disableRedirectHandling().disableContentCompression().disableCookieManagement()
                .build();
    }

    static void validateUrl(URI uri) {
        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("https") || scheme.equalsIgnoreCase("http"))
                || uri.getHost() == null || uri.getUserInfo() != null
                || !(uri.getPort() == -1 || uri.getPort() == 80 || uri.getPort() == 443)) {
            throw new InvalidPosterException("Use a public HTTP(S) poster URL on port 80 or 443");
        }
    }

    static Download readResponse(ClassicHttpResponse response) throws IOException {
        int status = response.getCode();
        if (status >= 300 && status <= 399 && response.getFirstHeader("Location") != null) {
            return new Download(response.getFirstHeader("Location").getValue(), null);
        }
        if (status != 200 || response.getEntity() == null) throw new InvalidPosterException("Poster download failed (HTTP " + status + ")");
        var entity = response.getEntity();
        String type = entity.getContentType();
        if (type == null || !type.toLowerCase(Locale.ROOT).split(";", 2)[0].trim().matches("image/(png|jpeg|webp)")) {
            throw new InvalidPosterException("Poster URL must return a PNG, JPEG, or WebP image");
        }
        if (entity.getContentLength() > MAX_BYTES) throw new InvalidPosterException("Poster image must not exceed 256 KB");
        // The caller cancels the request before closing its response. Closing the
        // entity stream here could drain an arbitrarily large body to reuse the socket.
        byte[] bytes = entity.getContent().readNBytes(MAX_BYTES + 1);
        if (bytes.length > MAX_BYTES) throw new InvalidPosterException("Poster image must not exceed 256 KB");
        return new Download(null, bytes);
    }

    static String encode(byte[] bytes) {
        if (bytes.length > MAX_BYTES) throw new InvalidPosterException("Poster image must not exceed 256 KB");
        String type;
        if (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && bytes[4] == 13 && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10) type = "png";
        else if (bytes.length >= 3 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff) type = "jpeg";
        else if (bytes.length >= 12 && new String(bytes, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(bytes, 8, 4, StandardCharsets.US_ASCII).equals("WEBP")) type = "webp";
        else throw new InvalidPosterException("Poster contents must be a PNG, JPEG, or WebP image");
        return "data:image/" + type + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    record Download(String location, byte[] bytes) {}
}
