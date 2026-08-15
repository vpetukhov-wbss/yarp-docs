// The canonical information architecture - not derived from content files
// (a slug's group membership is a navigational decision, not something a
// single page's frontmatter should be able to silently change), lifted
// verbatim (minus the `pdf` field, which named a source file the compiler
// no longer reads directly - see extract-pdf.mjs) from the same GROUPS
// table that has anchored this site's structure since Step 7.

export const LOCALES = ['en', 'bg', 'ru', 'fr', 'el', 'es', 'de', 'pt-BR', 'zh-Hans'];
export const DEFAULT_LOCALE = 'en';

export const GROUPS = [
  {
    id: 'getting-started',
    label: 'Getting started',
    items: [
      { slug: 'yarp-overview', title: 'Overview of YARP' },
      { slug: 'getting-started', title: 'Getting started' },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    items: [
      { slug: 'config-files', title: 'Configuration files' },
      { slug: 'config-filters', title: 'Configuration filters' },
      { slug: 'config-providers', title: 'Configuration providers' },
      { slug: 'http-client-config', title: 'HTTP client configuration' },
    ],
  },
  {
    id: 'routing',
    label: 'Routing',
    items: [
      { slug: 'header-routing', title: 'Header-based routing' },
      { slug: 'queryparameter-routing', title: 'Query parameter routing' },
    ],
  },
  {
    id: 'transforms',
    label: 'Transforms',
    items: [
      { slug: 'transforms', title: 'Overview' },
      { slug: 'transforms-request', title: 'Request transforms' },
      { slug: 'transforms-response', title: 'Response & trailer transforms' },
    ],
  },
  {
    id: 'traffic-reliability',
    label: 'Traffic & reliability',
    items: [
      { slug: 'load-balancing', title: 'Load balancing' },
      { slug: 'session-affinity', title: 'Session affinity' },
      { slug: 'dests-health-checks', title: 'Destination health checks' },
      { slug: 'rate-limiting', title: 'Rate limiting' },
      { slug: 'timeouts', title: 'Request timeouts' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    items: [
      { slug: 'authn-authz', title: 'Authentication & authorization' },
      { slug: 'cors', title: 'Cross-origin requests (CORS)' },
      { slug: 'https-tls', title: 'HTTPS & TLS' },
      { slug: 'header-guidelines', title: 'HTTP header guidelines' },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    items: [{ slug: 'output-caching', title: 'Output caching' }],
  },
  {
    id: 'protocols',
    label: 'Protocols',
    items: [
      { slug: 'grpc', title: 'Proxying gRPC' },
      { slug: 'http3', title: 'HTTP/3' },
      { slug: 'websockets', title: 'WebSockets & SPDY' },
    ],
  },
  {
    id: 'extensibility',
    label: 'Extensibility',
    items: [
      { slug: 'extensibility', title: 'Overview' },
      { slug: 'middleware', title: 'Middleware' },
      { slug: 'direct-forwarding', title: 'Direct forwarding' },
      { slug: 'destination-resolvers', title: 'Destination resolvers' },
      { slug: 'extensibility-transforms', title: 'Request & response transforms' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { slug: 'diagnosing-yarp-issues', title: 'Diagnosing YARP-based proxies' },
      { slug: 'distributed-tracing', title: 'Distributed tracing' },
      { slug: 'ab-testing', title: 'A/B testing & rolling upgrades' },
    ],
  },
  {
    id: 'deployment',
    label: 'Deployment',
    items: [
      { slug: 'kubernetes-ingress', title: 'Kubernetes Ingress Controller' },
      { slug: 'service-fabric-int', title: 'Service Fabric integration' },
      { slug: 'httpsys-delegation', title: 'HTTP.sys delegation' },
    ],
  },
];

export const APPENDIX = [{ slug: 'aspnetcore-getting-started', title: 'Get started with ASP.NET Core', kind: 'appendix' }];

export const SOURCE_URL_BASE = 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/';
export const SOURCE_URL_SLUG_OVERRIDES = {
  'yarp-overview': 'yarp-overview',
  extensibility: 'extensibility',
  'aspnetcore-getting-started': '../../../getting-started', // outside the yarp/ tree entirely
};

// Flat, ordered list of every slug across every group plus the appendix -
// the single definition of "reading order" that prev/next, nav generation,
// and the translation-batch scripts all share.
export const ALL_ITEMS = [
  ...GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id, kind: 'doc' }))),
  ...APPENDIX.map((item) => ({ ...item, groupId: 'appendix' })),
];

export function findGroupId(slug) {
  return ALL_ITEMS.find((item) => item.slug === slug)?.groupId ?? null;
}

export function englishTitleFor(slug) {
  return ALL_ITEMS.find((item) => item.slug === slug)?.title ?? null;
}

export function sourceUrlFor(slug) {
  const override = SOURCE_URL_SLUG_OVERRIDES[slug];
  return `${SOURCE_URL_BASE}${override ?? slug}`;
}

// prev/next order follows ALL_ITEMS exactly (doc pages then the appendix) -
// same order the app has used since Step 7's fixtures.
export function prevNextFor(slug) {
  const index = ALL_ITEMS.findIndex((item) => item.slug === slug);
  if (index === -1) {
    return { prevSlug: null, nextSlug: null };
  }
  return {
    prevSlug: index > 0 ? ALL_ITEMS[index - 1].slug : null,
    nextSlug: index < ALL_ITEMS.length - 1 ? ALL_ITEMS[index + 1].slug : null,
  };
}
