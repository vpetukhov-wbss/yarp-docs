---
slug: websockets
title: WebSockets 与 SPDY
lede: >-
  YARP 默认支持代理 WebSocket 和 SPDY 连接。此支持适用于
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/websockets
lastUpdated: 2026-08-11
---

## YARP 代理 WebSockets 和 SPDY

## 简介

YARP 默认支持代理 WebSocket 和 SPDY 连接。该支持同时适用于直接转发和完整管道两种方式。

WebSockets 是一种双向流式协议,构建于 HTTP/1.1 之上,后来又适配到了 HTTP/2 。

SPDY 是 HTTP/2 的前身,常用于 Kubernetes 环境中。

## HTTP/1.1 升级

WebSockets 和 SPDY 都构建于 HTTP/1.1 之上,借助一项称为“连接升级”的特性实现。YARP 会代理初始请求,如果目标服务器返回 101 Switching Protocols 响应,就会将该连接升级为使用新协议的不透明双向流。YARP 不支持以这种方式升级到 HTTP/2 等其他协议。

## HTTP/2

从 .NET 7 和 YARP 2.0 开始,YARP 支持基于 HTTP/2 的 WebSockets。Kestrel 是唯一支持接受传入 HTTP/2 WebSocket 请求的 AspNetCore 服务器,且该支持是自动启用的。浏览器可以检测到服务器公告的这一支持,并自动切换到 HTTP/2。

传入和传出的协议版本不需要一致。传入的 WebSocket 请求可以是 HTTP/1.1 或 HTTP/2。对于传出请求,没有专门针对 WebSockets 的配置,YARP 会使用 ForwarderRequestConfig 的 Version 和 VersionPolicy 来确定所用的出站版本。它们默认分别为 HTTP/2 和 RequestVersionOrLower。

WebSockets 在 HTTP/2 下需要使用不同的 HTTP 标头,因此 YARP 会在不同版本之间进行适配时按需添加和移除这些标头。

完成初始握手之后,WebSockets 在这两种 HTTP 版本下的工作方式是相同的。

## 超时

HTTP 请求超时(.NET 8+)可以按默认设置或按策略为所有请求应用超时。

这些超时会在 WebSocket 握手完成后被禁用。它们仍会适用于 gRPC

请求。有关更多配置信息,请参阅请求超时。

:::note
本文作者在 AI 的协助下创作本文。了解详情
:::
