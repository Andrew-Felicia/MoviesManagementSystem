package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.exception.InvalidPosterException;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.core5.http.ClassicHttpRequest;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.ByteArrayEntity;
import org.apache.hc.core5.http.io.entity.InputStreamEntity;
import org.apache.hc.core5.http.message.BasicClassicHttpResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.util.Base64;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PosterStorageServiceTest {
    private final PosterStorageService service = new PosterStorageService();
    private static final byte[] PNG = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=");

    @Test
    void storesEmbeddedImagesAndClearsEmptyPosters() {
        assertThat(service.store(null)).isNull();
        assertThat(service.store("  ")).isNull();
        String png = "data:image/png;base64," + Base64.getEncoder().encodeToString(PNG);
        assertThat(service.store(" " + png + " ")).isEqualTo(png);
        assertThat(service.store("DATA:IMAGE/PNG;BASE64," + Base64.getEncoder().encodeToString(PNG))).isEqualTo(png);
        assertThat(PosterStorageService.encode(new byte[]{(byte)255, (byte)216, (byte)255})).startsWith("data:image/jpeg;");
        assertThat(PosterStorageService.encode("RIFF1234WEBPtest".getBytes())).startsWith("data:image/webp;");
        assertThatThrownBy(() -> service.store("data:image/jpeg;base64," + Base64.getEncoder().encodeToString(PNG))).hasMessageContaining("does not match");
        assertThatThrownBy(() -> service.store("data:image/png;base64,%%%" )).isInstanceOf(InvalidPosterException.class);
        assertThatThrownBy(() -> service.store("data:broken")).isInstanceOf(InvalidPosterException.class);
        assertThatThrownBy(() -> service.store("data:image/png;base64," + "A".repeat(350000))).isInstanceOf(InvalidPosterException.class);
        assertThatThrownBy(() -> PosterStorageService.encode(new byte[PosterStorageService.MAX_BYTES + 1])).hasMessageContaining("256 KB");
        assertThatThrownBy(() -> PosterStorageService.encode("<svg></svg>".getBytes())).isInstanceOf(InvalidPosterException.class);
        assertThatThrownBy(() -> PosterStorageService.encode(new byte[0])).isInstanceOf(InvalidPosterException.class);
    }

    @Test
    void downloadsImageAndFollowsOnlyValidatedRedirects() throws Exception {
        PosterStorageService downloader = spy(service);
        CloseableHttpClient client = mock(CloseableHttpClient.class);
        doReturn(client).when(downloader).createClient();
        var redirect = new BasicClassicHttpResponse(302);
        redirect.setHeader("Location", "/poster.png");
        var ok = imageResponse();
        when(client.executeOpen(isNull(), any(ClassicHttpRequest.class), isNull())).thenReturn(redirect, ok);
        assertThat(downloader.store("https://example.com/start")).isEqualTo(PosterStorageService.encode(PNG));
        verify(client, times(2)).executeOpen(isNull(), any(ClassicHttpRequest.class), isNull());

        redirect.setHeader("Location", "http://127.0.0.1/private");
        when(client.executeOpen(isNull(), any(ClassicHttpRequest.class), isNull())).thenReturn(redirect);
        assertThatThrownBy(() -> downloader.store("https://example.com/start")).isInstanceOf(InvalidPosterException.class);
        redirect.setHeader("Location", "https://example.com/loop");
        assertThatThrownBy(() -> downloader.store("https://example.com/start")).hasMessageContaining("too many");
        when(client.executeOpen(isNull(), any(ClassicHttpRequest.class), isNull())).thenThrow(new IOException("Timeout"));
        assertThatThrownBy(() -> downloader.store("http://8.8.8.8/image")).hasMessageContaining("Could not download");
        assertThatThrownBy(() -> service.store("http://[::1]/image")).isInstanceOf(InvalidPosterException.class);
    }

    @Test
    void boundsResponseBodiesEvenWithoutContentLength() throws Exception {
        var response = imageResponse();
        assertThat(PosterStorageService.readResponse(response).bytes()).isEqualTo(PNG);
        response.setEntity(new ByteArrayEntity(new byte[PosterStorageService.MAX_BYTES + 1], ContentType.IMAGE_PNG));
        assertThatThrownBy(() -> PosterStorageService.readResponse(response)).hasMessageContaining("256 KB");
        response.setEntity(new InputStreamEntity(new ByteArrayInputStream(new byte[PosterStorageService.MAX_BYTES + 1]), ContentType.IMAGE_PNG));
        assertThatThrownBy(() -> PosterStorageService.readResponse(response)).hasMessageContaining("256 KB");
        response.setEntity(new ByteArrayEntity(PNG, ContentType.TEXT_HTML));
        assertThatThrownBy(() -> PosterStorageService.readResponse(response)).hasMessageContaining("must return");
        response.setEntity(new ByteArrayEntity(PNG, null));
        assertThatThrownBy(() -> PosterStorageService.readResponse(response)).hasMessageContaining("must return");
        response.setEntity(null);
        assertThatThrownBy(() -> PosterStorageService.readResponse(response)).hasMessageContaining("HTTP 200");
        response.setCode(404);
        assertThatThrownBy(() -> PosterStorageService.readResponse(response)).hasMessageContaining("HTTP 404");
        response.setCode(302);
        assertThatThrownBy(() -> PosterStorageService.readResponse(response)).hasMessageContaining("HTTP 302");
    }

    @ParameterizedTest
    @ValueSource(strings={"/relative", "file:///tmp/image", "ftp://example.com/image", "http://user:password@example.com/image", "http://example.com:8080/image", "http:/broken"})
    void rejectsInvalidUrls(String value) {
        assertThatThrownBy(() -> service.store(value)).isInstanceOf(InvalidPosterException.class);
    }

    @Test
    void acceptsStandardHttpPorts() {
        PosterStorageService.validateUrl(URI.create("http://example.com:80/a"));
        PosterStorageService.validateUrl(URI.create("https://example.com:443/a"));
    }

    @ParameterizedTest
    @ValueSource(strings={"0.0.0.0", "127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "100.127.1.1", "192.0.0.1", "198.18.0.1", "198.19.1.1", "198.51.100.1", "203.0.113.1", "224.0.0.1", "255.255.255.255", "::", "::1", "fc00::1", "fe80::1", "ff02::1", "::ffff:127.0.0.1", "2001:db8::1", "2002:7f00:1::", "2001::1"})
    void blocksNonPublicAddresses(String value) {
        assertThatThrownBy(() -> new PublicPosterDnsResolver().resolve(value)).isInstanceOf(java.net.UnknownHostException.class);
    }

    @ParameterizedTest
    @ValueSource(strings={"8.8.8.8", "100.63.0.1", "100.128.0.1", "192.1.1.1", "198.17.0.1", "198.51.99.1", "203.0.112.1", "203.1.0.1", "2001:4860:4860::8888", "2606:4700:4700::1111"})
    void permitsPublicAddresses(String value) throws Exception {
        PublicPosterDnsResolver.requirePublic(InetAddress.getByName(value));
        assertThat(new PublicPosterDnsResolver().resolveCanonicalHostname(value)).isEqualTo(value);
    }

    private static BasicClassicHttpResponse imageResponse() {
        var response = new BasicClassicHttpResponse(200);
        response.setEntity(new ByteArrayEntity(PNG, ContentType.IMAGE_PNG));
        return response;
    }
}
