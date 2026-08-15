# Glossary

The consistency mechanism for translating the 36 pages under `content/`.
Check here before inventing a term for something that already has an
agreed translation, so the same English concept doesn't end up rendered
three different ways across three different pages in the same locale.

This is a first-pass reference, not a locked contract — if you're
translating a page and a term below reads awkwardly in context, prefer
what a native technical reader would actually expect, and update this
table in the same commit so the next page stays consistent with your
correction rather than the old entry.

## Never translate

These stay in English (unchanged, no transliteration) in every locale,
in prose and in inline code alike:

- **Product and brand names** — YARP, ASP.NET Core, .NET (and versioned
  forms like ".NET 8"), Microsoft Learn, Kubernetes, Service Fabric,
  IIS, C# (the language name).
- **Protocol and standard names** — HTTP, HTTPS, HTTP/2, HTTP/3, TLS,
  SSL, gRPC, WebSocket(s), SPDY, CORS.
- **Every identifier from the actual API surface**: type names, interface
  names, method names, config keys, and enum values — anything that would
  appear as `` `InlineCode` `` or inside a fenced block. Examples already in
  use: `LoadBalancingPolicy`, `ILoadBalancingPolicy`, `PowerOfTwoChoices`,
  `IProxyConfigProvider`, `ReverseProxyConfig`, `Clusters`, `Destinations`,
  `Routes`. This isn't just a style preference — fenced code block content
  is taken from the English source by construction (see `README.md`), so a
  translated inline mention that doesn't match what the surrounding code
  block actually says reads as a contradiction, not a translation.
- **File and config names** — `appsettings.json`, `Program.cs`,
  `launchSettings.json`, HTTP header names (`Access-Control-Allow-Origin`,
  etc.).
- **Other proxy/gateway product names**, if ever mentioned for comparison
  (NGINX, HAProxy, Envoy, ...).

## Recurring concepts — per-locale terms

Standard MSFT-docs terminology where a well-established one exists;
otherwise the clearest direct rendering. "Reverse proxy" as YARP's own
tagline ("Yet Another *Reverse Proxy*") is a product-name context and
stays English even where the table below says to translate the generic
concept — see `home.heroTitle` in every locale's `public/assets/i18n/*.json`
for that exact case already handled this way.

| Concept                | bg                              | ru                        | fr                             | el                                  | es                            | de                        | pt-BR                        | zh-Hans  |
| ----------------------- | -------------------------------- | -------------------------- | -------------------------------- | ------------------------------------- | ------------------------------- | --------------------------- | ------------------------------- | -------- |
| destination             | дестинация                      | узел назначения           | destination                     | προορισμός                           | destino                        | Ziel                        | destino                         | 目标      |
| cluster                 | клъстер                         | кластер                    | cluster                         | cluster                              | clúster                         | Cluster                     | cluster                         | 群集      |
| route                   | маршрут                         | маршрут                    | route                           | διαδρομή                             | ruta                            | Route                       | rota                            | 路由      |
| load balancing (concept)| балансиране на натоварването    | балансировка нагрузки     | équilibrage de charge           | εξισορρόπηση φορτίου                 | equilibrio de carga            | Lastverteilung              | balanceamento de carga          | 负载均衡  |
| health check            | проверка на състоянието         | проверка работоспособности| vérification d'intégrité        | έλεγχος υγείας                       | comprobación de estado          | Zustandsprüfung             | verificação de integridade      | 运行状况检查 |
| session affinity        | афинитет на сесията             | привязка сессии            | affinité de session              | συνάφεια συνεδρίας                   | afinidad de sesión              | Sitzungsaffinität           | afinidade de sessão             | 会话相关性 |
| transform                | трансформация                   | преобразование             | transformation                   | μετασχηματισμός                      | transformación                  | Transformation               | transformação                   | 转换      |
| middleware               | middleware                      | промежуточное ПО           | intergiciel                      | ενδιάμεσο λογισμικό                  | middleware                      | Middleware                  | middleware                      | 中间件    |
| rate limiting            | ограничаване на честотата       | ограничение частоты запросов | limitation de débit           | περιορισμός ρυθμού                   | limitación de velocidad         | Ratenbegrenzung             | limitação de taxa               | 速率限制  |
| output caching           | кеширане на изхода              | кеширование вывода         | mise en cache de sortie          | προσωρινή αποθήκευση εξόδου          | almacenamiento en caché de salida | Ausgabezwischenspeicherung | cache de saída                  | 输出缓存  |
| reverse proxy (generic)  | обратно прокси                  | обратный прокси            | proxy inverse                    | αντίστροφος διακομιστής μεσολάβησης  | proxy inverso                   | Reverse Proxy               | proxy reverso                   | 反向代理  |
| forwarding                | препращане                     | перенаправление            | transfert                        | προώθηση                             | reenvío                         | Weiterleitung                | encaminhamento                  | 转发      |

The one real precedent so far — `content/de/load-balancing.md` — already
uses **Ziel** (destination), **Cluster**, **Lastverteilung** (load
balancing), **Zustandsprüfungen** (health checks, plural form),
**fehlerfrei** (healthy), **Sitzungsaffinität** (session affinity), and
**Richtlinie** (policy) consistently; treat that file as the worked
example for how these terms sit inside real prose, not just this table.
