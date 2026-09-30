import type { LocaleCode } from '../../../core/models/locale.model';
import { projectCatalog } from './project-catalog';

type LocalizedText = Readonly<Record<LocaleCode, string>>;

const t = (
  en: string,
  bg: string,
  ru: string,
  fr: string,
  el: string,
  es: string,
  de: string,
  ptBR: string,
  zhHans: string,
): LocalizedText => ({
  en,
  bg,
  ru,
  fr,
  el,
  es,
  de,
  'pt-BR': ptBR,
  'zh-Hans': zhHans,
});

export const yarpGatewayProject = {
  slug: 'yarp-gateway',
  name: 'YARP Gateway',
  domain: t(
    'Enterprise multi-tenant application gateway',
    'Enterprise мултитенантен application gateway',
    'Корпоративный мультитенантный application gateway',
    'Passerelle applicative d’entreprise multi-tenant',
    'Enterprise multi-tenant application gateway',
    'Gateway empresarial multi-tenant para aplicaciones',
    'Enterprise Multi-Tenant Application Gateway',
    'Gateway empresarial multi-tenant para aplicações',
    '企业级多租户应用网关',
  ),
  shortDescription: t(
    'A dynamic YARP-based platform that combines reverse proxy routing with platform-owned identity, tenant resolution, subscriptions, entitlements and policy-driven access.',
    'Динамична платформа върху YARP, която комбинира reverse proxy routing с platform-owned identity, tenant resolution, абонаменти, entitlements и policy-driven access.',
    'Динамическая платформа на базе YARP, объединяющая reverse proxy routing с платформенной идентификацией, tenant resolution, подписками, entitlements и policy-driven access.',
    'Une plateforme dynamique basée sur YARP combinant reverse proxy, identité gérée par la plateforme, résolution des tenants, abonnements, droits et accès piloté par des politiques.',
    'Δυναμική πλατφόρμα βασισμένη στο YARP που συνδυάζει reverse proxy routing με platform-owned identity, tenant resolution, συνδρομές, entitlements και policy-driven access.',
    'Plataforma dinámica basada en YARP que combina reverse proxy routing con identidad gestionada por la plataforma, resolución de tenants, suscripciones, entitlements y acceso basado en políticas.',
    'Eine dynamische YARP-basierte Plattform, die Reverse-Proxy-Routing mit plattformeigener Identität, Tenant-Auflösung, Abonnements, Entitlements und richtliniengesteuertem Zugriff verbindet.',
    'Plataforma dinâmica baseada em YARP que combina reverse proxy routing com identidade da plataforma, resolução de tenants, assinaturas, entitlements e acesso orientado por políticas.',
    '基于 YARP 的动态平台，将反向代理路由与平台自有身份、多租户解析、订阅、应用授权和策略驱动访问整合在一起。',
  ),
  problem: t(
    'Centralizes application access decisions and dynamic proxy configuration for many organizations while keeping PostgreSQL/Marten as the durable source of truth and publishing validated runtime snapshots to memory or Redis.',
    'Централизира решенията за достъп до приложения и динамичната proxy конфигурация за много организации, като PostgreSQL/Marten остава durable source of truth, а валидираните runtime snapshots се публикуват в Memory или Redis.',
    'Централизует решения доступа к приложениям и динамическую proxy-конфигурацию для множества организаций, сохраняя PostgreSQL/Marten как durable source of truth и публикуя проверенные runtime snapshots в Memory или Redis.',
    'Centralise les décisions d’accès aux applications et la configuration dynamique du proxy pour plusieurs organisations, avec PostgreSQL/Marten comme source durable et des snapshots validés publiés en mémoire ou Redis.',
    'Κεντρικοποιεί τις αποφάσεις πρόσβασης και τη δυναμική proxy configuration για πολλούς οργανισμούς, με PostgreSQL/Marten ως durable source of truth και validated runtime snapshots σε Memory ή Redis.',
    'Centraliza las decisiones de acceso a aplicaciones y la configuración dinámica del proxy para múltiples organizaciones, manteniendo PostgreSQL/Marten como fuente durable y publicando snapshots validados en memoria o Redis.',
    'Zentralisiert Anwendungszugriff und dynamische Proxy-Konfiguration für viele Organisationen, mit PostgreSQL/Marten als dauerhafter Source of Truth und validierten Runtime-Snapshots in Memory oder Redis.',
    'Centraliza decisões de acesso e configuração dinâmica de proxy para várias organizações, mantendo PostgreSQL/Marten como fonte durável e publicando snapshots validados em memória ou Redis.',
    '集中处理多组织的应用访问决策和动态代理配置，以 PostgreSQL/Marten 作为持久事实来源，并将经过验证的运行时快照发布到内存或 Redis。',
  ),
  targetUsers: [
    t('Platform administrator', 'Платформен администратор', 'Администратор платформы', 'Administrateur de plateforme', 'Διαχειριστής πλατφόρμας', 'Administrador de plataforma', 'Plattformadministrator', 'Administrador da plataforma', '平台管理员'),
    t('Tenant administrator', 'Tenant администратор', 'Администратор tenant', 'Administrateur de tenant', 'Tenant administrator', 'Administrador de tenant', 'Tenant-Administrator', 'Administrador do tenant', '租户管理员'),
    t('Application team', 'Application екип', 'Команда приложения', 'Équipe applicative', 'Ομάδα εφαρμογής', 'Equipo de aplicación', 'Anwendungsteam', 'Equipe da aplicação', '应用团队'),
    t('Authorized end user', 'Оторизиран краен потребител', 'Авторизованный пользователь', 'Utilisateur final autorisé', 'Εξουσιοδοτημένος τελικός χρήστης', 'Usuario final autorizado', 'Autorisierter Endbenutzer', 'Usuário final autorizado', '已授权终端用户'),
  ],
  architecture: ['Modular Monolith', 'DDD', 'CQRS', 'Event-driven configuration', 'Multi-tenancy', 'Policy-based authorization'],
  frontend: ['Angular', 'NgRx Signal Store', 'Allianz Aposin / Aquila', 'Ionic / Capacitor'],
  backend: ['.NET 10', 'ASP.NET Core', 'YARP Reverse Proxy', 'Marten', 'PostgreSQL', 'JWT Bearer'],
  infrastructure: ['.NET Aspire', 'InMemory / Redis cache', 'OpenTelemetry', 'PostgreSQL'],
  engineeringHighlights: [
    t(
      'Persist-first configuration updates with validated, versioned runtime snapshots',
      'Persist-first конфигурационни промени с валидирани и versioned runtime snapshots',
      'Persist-first обновления конфигурации с валидированными и версионированными runtime snapshots',
      'Mises à jour persist-first avec snapshots runtime validés et versionnés',
      'Persist-first configuration updates με validated και versioned runtime snapshots',
      'Actualizaciones persist-first con snapshots de runtime validados y versionados',
      'Persist-first Konfigurationsupdates mit validierten, versionierten Runtime-Snapshots',
      'Atualizações persist-first com snapshots de runtime validados e versionados',
      '先持久化配置更新，并发布经过验证、带版本的运行时快照',
    ),
    t(
      'Identity → tenant → membership → subscription → entitlement → permission → route access pipeline',
      'Identity → tenant → membership → subscription → entitlement → permission → route access pipeline',
      'Identity → tenant → membership → subscription → entitlement → permission → route access pipeline',
      'Pipeline Identity → tenant → membership → subscription → entitlement → permission → route access',
      'Identity → tenant → membership → subscription → entitlement → permission → route access pipeline',
      'Pipeline Identity → tenant → membership → subscription → entitlement → permission → route access',
      'Identity → Tenant → Membership → Subscription → Entitlement → Permission → Route-Access-Pipeline',
      'Pipeline Identity → tenant → membership → subscription → entitlement → permission → route access',
      'Identity → tenant → membership → subscription → entitlement → permission → route access 访问链路',
    ),
    t(
      'Last Known Good proxy configuration with atomic YARP publication',
      'Last Known Good proxy конфигурация с атомарно публикуване към YARP',
      'Last Known Good proxy-конфигурация с атомарной публикацией в YARP',
      'Configuration proxy Last Known Good avec publication YARP atomique',
      'Last Known Good proxy configuration με atomic YARP publication',
      'Configuración proxy Last Known Good con publicación atómica en YARP',
      'Last-Known-Good-Proxy-Konfiguration mit atomarer YARP-Veröffentlichung',
      'Configuração proxy Last Known Good com publicação atômica no YARP',
      'Last Known Good 代理配置与 YARP 原子发布',
    ),
    t(
      'Secure trusted-context propagation without trusting client-supplied tenant or authorization headers',
      'Сигурно trusted-context propagation без доверие на client-supplied tenant или authorization headers',
      'Безопасная передача trusted context без доверия к tenant или authorization headers от клиента',
      'Propagation sécurisée du contexte de confiance sans faire confiance aux en-têtes tenant ou authorization fournis par le client',
      'Secure trusted-context propagation χωρίς εμπιστοσύνη σε client-supplied tenant ή authorization headers',
      'Propagación segura de contexto confiable sin confiar en cabeceras tenant o authorization enviadas por el cliente',
      'Sichere Trusted-Context-Weitergabe ohne Vertrauen in vom Client gelieferte Tenant- oder Authorization-Header',
      'Propagação segura de contexto confiável sem confiar em headers tenant ou authorization enviados pelo cliente',
      '安全传播可信上下文，不信任客户端提供的租户或授权头',
    ),
  ],
  documentationUrl: '',
  status: t(
    'Architecture & active implementation',
    'Архитектура и активна имплементация',
    'Архитектура и активная реализация',
    'Architecture et implémentation active',
    'Αρχιτεκτονική και ενεργή υλοποίηση',
    'Arquitectura e implementación activa',
    'Architektur & aktive Implementierung',
    'Arquitetura e implementação ativa',
    '架构设计与持续实现',
  ),
} as const;

export const publicProjectCatalog = [...projectCatalog, yarpGatewayProject] as const;

export function localized(
  text: LocalizedText,
  locale: LocaleCode | string | null | undefined,
): string {
  const code = locale && locale in text ? (locale as LocaleCode) : 'en';
  return text[code];
}

export function findPublicProject(slug: string | null) {
  return publicProjectCatalog.find((project) => project.slug === slug);
}
