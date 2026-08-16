---
slug: https-tls
title: HTTPS & TLS
lede: >-
  HTTPS (HTTP over TLS encrypted connections) is the standard way to make HTTP requests on
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/https-tls
lastUpdated: 2026-08-11
---

HTTPS (HTTP over TLS encrypted connections) is the standard way to make HTTP requests on the Internet for security, integrity, and privacy reasons. There are several HTTPS/TLS considerations to account for when using a reverse proxy like YARP.

## TLS Termination {#tls-termination}

YARP is a level 7 HTTP proxy which means that incoming HTTPS/TLS connections are fully decrypted by the proxy so it can process and forward the HTTP requests. This is commonly known as TLS Termination. The outgoing connections to the destination(s) may or may not be encrypted, depending on the configuration provided.

TLS tunneling (CONNECT)

TLS tunneling using the CONNECT method is a feature used to proxy requests without decrypting them. This is not supported by YARP and there are no plans to add it.

## Configuring incoming connections {#configuring-incoming-connections}

YARP can run on top of all ASP.NET Core servers and configuring HTTPS/TLS for incoming connections is server specific. Check the docs for Kestrel, IIS, and Http.Sys for configuration details.

## Advanced TLS filters with Kestrel {#advanced-tls-filters-with-kestrel}

Kestrel supports intercepting incoming connections before the TLS handshake. YARP includes a TlsFrameHelper API that can parse the raw TLS handshake and enable you to gather custom telemetry or eagerly reject connections. These APIs cannot modify the TLS handshake or decrypt the data stream. See this example .

## Configuring outgoing connections {#configuring-outgoing-connections}

To enable TLS encryption when communicating with a destination specify the destination address as https like "https://destinationHost" . See the configuration docs for examples.

The host name specified in the destination address will be used for the TLS handshake by

default, including SNI and server certificate validation. If proxying the original host header is

enabled, that value will be used for the TLS handshake instead. If a custom host value needs to

be used then use the RequestHeader transform to set the host header.

Outbound connections to the destinations are handled by HttpClient/SocketsHttpHandler. A different instance and settings can be configured per cluster. Some settings are available in the configuration model, while others can only be configured in code. See the HttpClient docs for details.

Destination server certificates need to be trusted by the proxy or custom validation needs to be applied via the HttpClient configuration.

:::note
The author created this article with assistance from AI. Learn more
:::
