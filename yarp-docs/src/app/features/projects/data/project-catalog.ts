import type { LocaleCode } from '../../../core/models/locale.model';

export type ProjectSlug = 'dudewash' | 'foodreg' | 'rasm' | 'qwen-hosting';

interface LocalizedText {
  readonly en: string;
  readonly bg: string;
}

export interface ProjectSummary {
  readonly slug: ProjectSlug;
  readonly name: string;
  readonly domain: LocalizedText;
  readonly shortDescription: LocalizedText;
  readonly problem: LocalizedText;
  readonly targetUsers: readonly string[];
  readonly architecture: readonly string[];
  readonly frontend: readonly string[];
  readonly backend: readonly string[];
  readonly infrastructure: readonly string[];
  readonly engineeringHighlights: readonly LocalizedText[];
  readonly documentationUrl: string;
  readonly status: LocalizedText;
}

export const projectCatalog: readonly ProjectSummary[] = [
  {
    slug: 'dudewash',
    name: 'DudeWash',
    domain: { en: 'Car wash SaaS & marketplace', bg: 'SaaS и marketplace платформа за автомивки' },
    shortDescription: {
      en: 'A multi-tenant platform for fixed-location and mobile car-wash businesses, covering operations, bookings, workforce and marketplace flows.',
      bg: 'Мултитенантна платформа за стационарни и мобилни автомивки, обхващаща операции, резервации, екипи и marketplace процеси.',
    },
    problem: {
      en: 'Unifies provider operations, scheduling, mobile service areas, customer bookings and commercial workflows in one domain model.',
      bg: 'Обединява операциите на доставчика, графиците, мобилните зони, клиентските резервации и търговските процеси в един домейн модел.',
    },
    targetUsers: ['Organization / Provider', 'Washer / Technician', 'Customer / Driver', 'SuperAdmin'],
    architecture: ['Modular Monolith', 'DDD', 'CQRS', 'Vertical Slices', 'Multi-tenancy'],
    frontend: ['Blazor Web App', '.NET MAUI Blazor Hybrid'],
    backend: ['.NET 10', 'ASP.NET Core', 'EF Core', 'MediatR', 'Carter', 'FluentValidation', 'Mapster'],
    infrastructure: ['SQL Server', '.NET Aspire', 'OpenTelemetry'],
    engineeringHighlights: [
      { en: 'Multi-tenant organization and location boundaries', bg: 'Мултитенантни граници за организации и локации' },
      { en: 'Scheduling, bookings, subscriptions, payments and payouts', bg: 'Графици, резервации, абонаменти, плащания и изплащания' },
      { en: 'Shared web/mobile product model', bg: 'Споделен продуктов модел за web и mobile' },
    ],
    documentationUrl: 'https://webuildssoftwaresolutions.gitbook.io/24carwash-documentation/',
    status: { en: 'Active product engineering', bg: 'Активна продуктова разработка' },
  },
  {
    slug: 'foodreg',
    name: 'FoodReg',
    domain: { en: 'Food compliance & HACCP', bg: 'Съответствие за хранителен бизнес и HACCP' },
    shortDescription: {
      en: 'A compliance-oriented platform that helps food businesses structure regulatory requirements, evidence, checks and readiness.',
      bg: 'Платформа за съответствие, която помага на хранителния бизнес да структурира нормативни изисквания, доказателства, проверки и готовност.',
    },
    problem: {
      en: 'Turns fragmented regulatory obligations into traceable requirements, applicability rules, checks and findings.',
      bg: 'Превръща разпокъсаните нормативни задължения в проследими изисквания, правила за приложимост, проверки и констатации.',
    },
    targetUsers: ['Food business operator', 'Compliance specialist', 'Facility manager', 'Auditor / reviewer'],
    architecture: ['DDD', 'CQRS', 'Modular Monolith', 'Rule-oriented domain model'],
    frontend: ['Modern web application'],
    backend: ['.NET', 'ASP.NET Core', 'Domain-centric APIs'],
    infrastructure: ['PostgreSQL / SQL storage', 'Observability', 'Documented compliance evidence'],
    engineeringHighlights: [
      { en: 'Source → Provision → Requirement → Rule → Check → Finding traceability', bg: 'Проследимост Source → Provision → Requirement → Rule → Check → Finding' },
      { en: 'Facility, room and equipment modelling', bg: 'Моделиране на обекти, помещения и оборудване' },
      { en: 'Readiness indicators without presenting official approval', bg: 'Индикатори за готовност без представяне като официално одобрение' },
    ],
    documentationUrl: 'https://webuildssoftwaresolutions.gitbook.io/foodreg-documentation/',
    status: { en: 'MVP domain development', bg: 'Разработка на MVP домейна' },
  },
  {
    slug: 'rasm',
    name: 'RASM',
    domain: { en: 'Regulated business compliance', bg: 'Съответствие за регулиран бизнес' },
    shortDescription: {
      en: 'A compliance-first B2B operational platform for lawful regulated adult-service businesses.',
      bg: 'B2B оперативна платформа с compliance-first подход за законно регулирани adult-service бизнеси.',
    },
    problem: {
      en: 'Models jurisdictions, licensing, workforce, operations and evidence so regulated actions remain lawful, privacy-aware and auditable.',
      bg: 'Моделира юрисдикции, лицензиране, персонал, операции и доказателства, така че регулираните действия да са законни, privacy-aware и одитируеми.',
    },
    targetUsers: ['Regulated organization', 'Compliance team', 'Operations team', 'Auditor'],
    architecture: ['DDD', 'CQRS', 'Modular architecture', 'Effective-dated rules', 'Multi-tenancy'],
    frontend: ['Enterprise web application'],
    backend: ['.NET', 'Policy-driven domain services'],
    infrastructure: ['Auditability', 'Privacy-aware data design', 'Compliance evidence'],
    engineeringHighlights: [
      { en: 'Jurisdiction-aware policy modelling', bg: 'Моделиране на политики според юрисдикцията' },
      { en: 'Effective-dated regulatory rules', bg: 'Нормативни правила с период на валидност' },
      { en: 'Consent, privacy and auditability as domain constraints', bg: 'Съгласие, поверителност и одитируемост като домейн ограничения' },
    ],
    documentationUrl: 'https://webuildssoftwaresolutions.gitbook.io/rasm-documentation/',
    status: { en: 'Architecture and product development', bg: 'Архитектура и продуктова разработка' },
  },
  {
    slug: 'qwen-hosting',
    name: 'QWEN Hosting',
    domain: { en: 'Multi-tenant AI gateway', bg: 'Мултитенантен AI gateway' },
    shortDescription: {
      en: 'A private shared AI backend that centralizes model access, tenant/application context, tools, RAG and observability.',
      bg: 'Частен споделен AI backend, който централизира достъпа до модели, tenant/application контекст, инструменти, RAG и наблюдаемост.',
    },
    problem: {
      en: 'Provides one governed AI gateway for multiple applications while keeping model/runtime choices replaceable and policy-driven.',
      bg: 'Осигурява един управляван AI gateway за множество приложения, като моделите и runtime-ите остават заменяеми и policy-driven.',
    },
    targetUsers: ['Internal product teams', 'Tenant applications', 'AI-enabled services'],
    architecture: ['Multi-tenancy', 'AI Gateway', 'Model routing', 'Tools', 'RAG', 'Local-first inference'],
    frontend: ['Administration / observability surfaces'],
    backend: ['Gateway APIs', 'Policy / model router', 'Tool orchestration'],
    infrastructure: ['Local models', 'Cloud fallback', 'Observability', 'Cost-awareness'],
    engineeringHighlights: [
      { en: 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG', bg: 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG' },
      { en: 'Local-first inference with cloud fallback', bg: 'Local-first inference с cloud fallback' },
      { en: 'Model/runtime independence across applications', bg: 'Независимост от конкретен model/runtime между приложенията' },
    ],
    documentationUrl: 'https://webuildssoftwaresolutions.gitbook.io/qwen-hosting-documentation/',
    status: { en: 'Platform engineering', bg: 'Платформена разработка' },
  },
] as const;

export function localized(text: LocalizedText, locale: LocaleCode | string | null | undefined): string {
  return locale === 'bg' ? text.bg : text.en;
}

export function findProject(slug: string | null): ProjectSummary | undefined {
  return projectCatalog.find((project) => project.slug === slug);
}
