#!/usr/bin/env node
// The only surviving piece of the old PDF-scraping pipeline
// (build-mock-content.mjs, deleted in this pass) - kept as a one-time
// extraction AID for authoring, not as part of the build. It prints a
// source PDF's plain text to stdout and writes nothing; an author reads
// that output alongside the source PDF itself to write the actual
// content/<locale>/<slug>.md by hand. This is also the grounding mechanism
// for technical accuracy (see audit-identifiers.mjs) and the only way to
// recover the property tables the old heuristic parser shredded.
//
// Usage: node scripts/content/extract-pdf.mjs <slug>
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..'); // yarp-docs/scripts/content -> d:\DOWNLOADS\YARP

// Slug -> source PDF filename. Deliberately kept out of ia.mjs (which drives
// real navigation and has no reason to know about a dev-only extraction
// aid's file layout) - this is the one place that mapping still exists.
export const PDF_FILENAMES = {
  'yarp-overview': 'Overview of YARP _ Microsoft Learn.pdf',
  'getting-started': 'YARP Getting Started with YARP _ Microsoft Learn.pdf',
  'config-files': 'YARP Configuration Files _ Microsoft Learn.pdf',
  'config-filters': 'YARP Configuration Filters _ Microsoft Learn.pdf',
  'config-providers': 'YARP Extensibility Configuration Providers _ Microsoft Learn.pdf',
  'http-client-config': 'YARP HTTP Client Configuration _ Microsoft Learn.pdf',
  'header-routing': 'YARP Header Based Routing _ Microsoft Learn.pdf',
  'queryparameter-routing': 'YARP Query Parameter Based Routing _ Microsoft Learn.pdf',
  transforms: 'YARP Request and Response Transforms _ Microsoft Learn.pdf',
  'transforms-request': 'YARP Request Transforms _ Microsoft Learn.pdf',
  'transforms-response': 'YARP Response and Response Trailer Transforms _ Microsoft Learn.pdf',
  'load-balancing': 'YARP Load Balancing _ Microsoft Learn.pdf',
  'session-affinity': 'YARP Session Affinity _ Microsoft Learn.pdf',
  'dests-health-checks': 'YARP Destination health checks _ Microsoft Learn.pdf',
  'rate-limiting': 'YARP Rate Limiting _ Microsoft Learn.pdf',
  timeouts: 'YARP Request Timeouts _ Microsoft Learn.pdf',
  'authn-authz': 'YARP Authentication and Authorization _ Microsoft Learn.pdf',
  cors: 'YARP Cross-Origin Requests (CORS) _ Microsoft Learn.pdf',
  'https-tls': 'YARP HTTPS & TLS _ Microsoft Learn.pdf',
  'header-guidelines': 'YARP HTTP header guidelines _ Microsoft Learn.pdf',
  'output-caching': 'YARP Output Caching _ Microsoft Learn.pdf',
  grpc: 'YARP Proxying gRPC _ Microsoft Learn.pdf',
  http3: 'YARP HTTP_3 _ Microsoft Learn.pdf',
  websockets: 'YARP Proxying WebSockets and SPDY _ Microsoft Learn.pdf',
  extensibility: 'Overview of extensibility _ Microsoft Learn.pdf',
  middleware: 'YARP Middleware _ Microsoft Learn.pdf',
  'direct-forwarding': 'YARP Direct Forwarding _ Microsoft Learn.pdf',
  'destination-resolvers': 'YARP Extensibility Destination Resolvers _ Microsoft Learn.pdf',
  'extensibility-transforms': 'YARP Extensibility - Request and Response Transforms _ Microsoft Learn.pdf',
  'diagnosing-yarp-issues': 'YARP Diagnosing YARP-based proxies _ Microsoft Learn.pdf',
  'distributed-tracing': 'YARP Distributed tracing _ Microsoft Learn.pdf',
  'ab-testing': 'YARP A_B Testing and Rolling Upgrades _ Microsoft Learn.pdf',
  'kubernetes-ingress': 'YARP Kubernetes Ingress Controller _ Microsoft Learn.pdf',
  'service-fabric-int': 'YARP Service Fabric Integration _ Microsoft Learn.pdf',
  'httpsys-delegation': 'YARP HTTP.sys Delegation _ Microsoft Learn.pdf',
  'aspnetcore-getting-started': 'YARP.pdf',
};

// A bare 'pdftotext' on PATH works when this script runs inside Git Bash/
// Linux/macOS, but a Windows-native `node` process spawning a child via
// execFileSync doesn't resolve Git for Windows' POSIX-style mingw64/bin PATH
// entry the same way the shell that ran `node` did - confirmed directly in
// this project. Falling back to the known Git-for-Windows install location
// covers the common case without needing the user to fix PATH.
const PDFTOTEXT_CANDIDATES = ['pdftotext', 'C:\\Program Files\\Git\\mingw64\\bin\\pdftotext.exe'];

export function resolvePdftotext() {
  for (const candidate of PDFTOTEXT_CANDIDATES) {
    try {
      execFileSync(candidate, ['-v'], { stdio: 'pipe' });
      return candidate;
    } catch (error) {
      // poppler's `pdftotext -v` prints its version to stderr and still
      // exits non-zero by design (confirmed directly against the installed
      // binary) - only ENOENT (nothing ran at all) means "not found".
      if (error.code !== 'ENOENT') {
        return candidate;
      }
    }
  }
  throw new Error(
    'pdftotext not found. Install poppler-utils (e.g. via Git for Windows\' mingw64/bin, ' +
      'or `apt-get install poppler-utils` / `brew install poppler`) to use this extraction aid.',
  );
}

export function extractPdfText(pdftotextPath, pdfPath) {
  return execFileSync(pdftotextPath, ['-layout', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 });
}

export function pdfPathForSlug(slug) {
  const filename = PDF_FILENAMES[slug];
  if (!filename) {
    throw new Error(`No source PDF mapped for slug "${slug}" (see PDF_FILENAMES in this file)`);
  }
  return join(REPO_ROOT, filename);
}

function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/content/extract-pdf.mjs <slug>');
    process.exitCode = 1;
    return;
  }
  const pdftotextPath = resolvePdftotext();
  const text = extractPdfText(pdftotextPath, pdfPathForSlug(slug));
  process.stdout.write(text);
}

// Only run as a CLI when invoked directly - importing this module for
// pdfPathForSlug/PDF_FILENAMES (e.g. from audit-identifiers.mjs) must not
// also trigger a pdftotext extraction as a side effect. pathToFileURL
// handles Windows drive-letter casing/backslashes/spaces correctly, unlike
// a hand-rolled string comparison.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
