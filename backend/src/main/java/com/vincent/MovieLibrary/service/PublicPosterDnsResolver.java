package com.vincent.MovieLibrary.service;

import org.apache.hc.client5.http.DnsResolver;
import java.net.InetAddress;
import java.net.UnknownHostException;

/** Validates the exact addresses handed to the HTTP connection, preventing DNS rebinding. */
final class PublicPosterDnsResolver implements DnsResolver {
    @Override
    public InetAddress[] resolve(String host) throws UnknownHostException {
        InetAddress[] addresses = InetAddress.getAllByName(host);
        for (InetAddress address : addresses) requirePublic(address);
        return addresses;
    }

    @Override
    public String resolveCanonicalHostname(String host) throws UnknownHostException {
        resolve(host);
        return host;
    }

    static void requirePublic(InetAddress address) throws UnknownHostException {
        byte[] bytes = address.getAddress();
        int first = bytes[0] & 255;
        int second = bytes[1] & 255;
        boolean reserved = bytes.length == 4
                ? first == 0 || first >= 224 || (first == 100 && second >= 64 && second <= 127)
                    || (first == 192 && second == 0) || (first == 198 && (second == 18 || second == 19))
                    || (first == 198 && second == 51 && (bytes[2] & 255) == 100)
                    || (first == 203 && second == 0 && (bytes[2] & 255) == 113)
                // Accept IPv6 global unicast only; exclude transition and documentation ranges.
                : (first & 0xe0) != 0x20 || (first == 0x20 && second == 0x02)
                    || (first == 0x20 && second == 0x01 && (bytes[2] & 255) < 0x20);
        if (reserved || address.isAnyLocalAddress() || address.isLoopbackAddress()
                || address.isLinkLocalAddress() || address.isSiteLocalAddress() || address.isMulticastAddress()) {
            throw new UnknownHostException("Poster URL must point to a public internet address");
        }
    }
}
