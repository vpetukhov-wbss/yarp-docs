import type { LocaleCode } from '../../../core/models/locale.model';

export type ProjectSlug = 'dudewash' | 'foodreg' | 'rasm' | 'qwen-hosting';

type LocalizedText = Readonly<Record<LocaleCode, string>>;

export interface ProjectSummary {
  readonly slug: ProjectSlug;
  readonly name: string;
  readonly domain: LocalizedText;
  readonly shortDescription: LocalizedText;
  readonly problem: LocalizedText;
  readonly targetUsers: readonly LocalizedText[];
  readonly architecture: readonly string[];
  readonly frontend: readonly string[];
  readonly backend: readonly string[];
  readonly infrastructure: readonly string[];
  readonly engineeringHighlights: readonly LocalizedText[];
  readonly documentationUrl: string;
  readonly status: LocalizedText;
}

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

export const projectCatalog: readonly ProjectSummary[] = [
  {
    slug: 'dudewash',
    name: 'DudeWash',
    domain: t(
      'Car wash SaaS & marketplace',
      'SaaS и marketplace платформа за автомивки',
      'SaaS и marketplace для автомоек',
      'SaaS et marketplace pour stations de lavage',
      'SaaS και marketplace για πλυντήρια αυτοκινήτων',
      'SaaS y marketplace para lavaderos de coches',
      'SaaS & Marketplace für Autowäschen',
      'SaaS e marketplace para lava-rápidos',
      '洗车 SaaS 与服务市场',
    ),
    shortDescription: t(
      'A multi-tenant platform for fixed-location and mobile car-wash businesses, covering operations, bookings, workforce and marketplace flows.',
      'Мултитенантна платформа за стационарни и мобилни автомивки, обхващаща операции, резервации, екипи и marketplace процеси.',
      'Мультитенантная платформа для стационарных и мобильных автомоек: операции, бронирования, персонал и marketplace-процессы.',
      'Une plateforme multi-tenant pour les stations de lavage fixes et mobiles, couvrant les opérations, réservations, équipes et parcours marketplace.',
      'Πλατφόρμα multi-tenant για σταθερά και κινητά πλυντήρια αυτοκινήτων, με λειτουργίες, κρατήσεις, προσωπικό και marketplace ροές.',
      'Plataforma multi-tenant para lavaderos fijos y móviles que cubre operaciones, reservas, personal y flujos de marketplace.',
      'Eine Multi-Tenant-Plattform für stationäre und mobile Autowäschen mit Betrieb, Buchungen, Personal und Marketplace-Abläufen.',
      'Plataforma multi-tenant para lava-rápidos fixos e móveis, cobrindo operações, reservas, equipes e fluxos de marketplace.',
      '面向固定门店与移动洗车业务的多租户平台，覆盖运营、预约、人员和服务市场流程。',
    ),
    problem: t(
      'Unifies provider operations, scheduling, mobile service areas, customer bookings and commercial workflows in one domain model.',
      'Обединява операциите на доставчика, графиците, мобилните зони, клиентските резервации и търговските процеси в един домейн модел.',
      'Объединяет операции поставщика, расписания, мобильные зоны обслуживания, клиентские бронирования и коммерческие процессы в одной доменной модели.',
      'Unifie les opérations du prestataire, la planification, les zones mobiles, les réservations clients et les workflows commerciaux dans un même modèle métier.',
      'Ενοποιεί λειτουργίες παρόχου, προγραμματισμό, κινητές ζώνες, κρατήσεις πελατών και εμπορικές ροές σε ένα domain model.',
      'Unifica operaciones del proveedor, planificación, zonas móviles, reservas de clientes y flujos comerciales en un único modelo de dominio.',
      'Vereint Anbieterbetrieb, Planung, mobile Servicegebiete, Kundenbuchungen und kommerzielle Abläufe in einem Domänenmodell.',
      'Unifica operações do prestador, agenda, áreas móveis, reservas de clientes e fluxos comerciais em um único modelo de domínio.',
      '在统一领域模型中整合服务商运营、排班、移动服务区域、客户预约与商业流程。',
    ),
    targetUsers: [
      t('Organization / Provider', 'Организация / Доставчик', 'Организация / Поставщик', 'Organisation / Prestataire', 'Οργανισμός / Πάροχος', 'Organización / Proveedor', 'Organisation / Anbieter', 'Organização / Prestador', '组织 / 服务商'),
      t('Washer / Technician', 'Мияч / Техник', 'Мойщик / Техник', 'Laveur / Technicien', 'Πλύντης / Τεχνικός', 'Lavador / Técnico', 'Waschmitarbeiter / Techniker', 'Lavador / Técnico', '洗车员 / 技术人员'),
      t('Customer / Driver', 'Клиент / Шофьор', 'Клиент / Водитель', 'Client / Conducteur', 'Πελάτης / Οδηγός', 'Cliente / Conductor', 'Kunde / Fahrer', 'Cliente / Motorista', '客户 / 驾驶员'),
      t('SuperAdmin', 'SuperAdmin', 'SuperAdmin', 'SuperAdmin', 'SuperAdmin', 'SuperAdmin', 'SuperAdmin', 'SuperAdmin', '超级管理员'),
    ],
    architecture: ['Modular Monolith', 'DDD', 'CQRS', 'Vertical Slices', 'Multi-tenancy'],
    frontend: ['Blazor Web App', '.NET MAUI Blazor Hybrid'],
    backend: ['.NET 10', 'ASP.NET Core', 'EF Core', 'MediatR', 'Carter', 'FluentValidation', 'Mapster'],
    infrastructure: ['SQL Server', '.NET Aspire', 'OpenTelemetry'],
    engineeringHighlights: [
      t('Multi-tenant organization and location boundaries', 'Мултитенантни граници за организации и локации', 'Мультитенантные границы организаций и локаций', 'Frontières multi-tenant pour organisations et sites', 'Multi-tenant όρια για οργανισμούς και τοποθεσίες', 'Límites multi-tenant para organizaciones y ubicaciones', 'Multi-Tenant-Grenzen für Organisationen und Standorte', 'Limites multi-tenant para organizações e locais', '组织与地点的多租户边界'),
      t('Scheduling, bookings, subscriptions, payments and payouts', 'Графици, резервации, абонаменти, плащания и изплащания', 'Расписания, бронирования, подписки, платежи и выплаты', 'Planification, réservations, abonnements, paiements et reversements', 'Προγραμματισμός, κρατήσεις, συνδρομές, πληρωμές και αποδόσεις', 'Planificación, reservas, suscripciones, pagos y liquidaciones', 'Planung, Buchungen, Abonnements, Zahlungen und Auszahlungen', 'Agendamento, reservas, assinaturas, pagamentos e repasses', '排班、预约、订阅、支付与结算'),
      t('Shared web/mobile product model', 'Споделен продуктов модел за web и mobile', 'Единая продуктовая модель для web и mobile', 'Modèle produit partagé web/mobile', 'Κοινό product model για web/mobile', 'Modelo de producto compartido web/móvil', 'Gemeinsames Produktmodell für Web und Mobile', 'Modelo de produto compartilhado entre web e mobile', 'Web 与移动端共享产品模型'),
    ],
    documentationUrl: 'https://webuildssoftwaresolutions.gitbook.io/24carwash-documentation/',
    status: t('Active product engineering', 'Активна продуктова разработка', 'Активная продуктовая разработка', 'Développement produit actif', 'Ενεργή ανάπτυξη προϊόντος', 'Desarrollo activo del producto', 'Aktive Produktentwicklung', 'Desenvolvimento ativo do produto', '持续产品开发'),
  },
  {
    slug: 'foodreg',
    name: 'FoodReg',
    domain: t('Food compliance & HACCP', 'Съответствие за хранителен бизнес и HACCP', 'Пищевой compliance и HACCP', 'Conformité alimentaire & HACCP', 'Συμμόρφωση τροφίμων & HACCP', 'Compliance alimentario y HACCP', 'Lebensmittel-Compliance & HACCP', 'Compliance alimentar e HACCP', '食品合规与 HACCP'),
    shortDescription: t(
      'A compliance-oriented platform that helps food businesses structure regulatory requirements, evidence, checks and readiness.',
      'Платформа за съответствие, която помага на хранителния бизнес да структурира нормативни изисквания, доказателства, проверки и готовност.',
      'Платформа для compliance, помогающая пищевому бизнесу структурировать нормативные требования, доказательства, проверки и готовность.',
      'Une plateforme orientée conformité aidant les entreprises alimentaires à structurer exigences réglementaires, preuves, contrôles et préparation.',
      'Πλατφόρμα συμμόρφωσης που βοηθά επιχειρήσεις τροφίμων να οργανώνουν κανονιστικές απαιτήσεις, αποδεικτικά, ελέγχους και ετοιμότητα.',
      'Plataforma orientada al compliance que ayuda a negocios alimentarios a estructurar requisitos regulatorios, evidencias, controles y preparación.',
      'Eine Compliance-Plattform, die Lebensmittelbetriebe bei regulatorischen Anforderungen, Nachweisen, Prüfungen und Bereitschaft unterstützt.',
      'Plataforma de compliance que ajuda empresas alimentícias a estruturar requisitos regulatórios, evidências, verificações e prontidão.',
      '面向合规的食品企业平台，用于组织监管要求、证据、检查与准备状态。',
    ),
    problem: t(
      'Turns fragmented regulatory obligations into traceable requirements, applicability rules, checks and findings.',
      'Превръща разпокъсаните нормативни задължения в проследими изисквания, правила за приложимост, проверки и констатации.',
      'Преобразует разрозненные нормативные обязательства в прослеживаемые требования, правила применимости, проверки и результаты.',
      'Transforme des obligations réglementaires fragmentées en exigences traçables, règles d’applicabilité, contrôles et constats.',
      'Μετατρέπει κατακερματισμένες κανονιστικές υποχρεώσεις σε ιχνηλάσιμες απαιτήσεις, κανόνες εφαρμογής, ελέγχους και ευρήματα.',
      'Convierte obligaciones regulatorias fragmentadas en requisitos trazables, reglas de aplicabilidad, controles y hallazgos.',
      'Überführt fragmentierte regulatorische Pflichten in nachvollziehbare Anforderungen, Anwendbarkeitsregeln, Prüfungen und Feststellungen.',
      'Transforma obrigações regulatórias fragmentadas em requisitos rastreáveis, regras de aplicabilidade, verificações e constatações.',
      '将分散的监管义务转化为可追踪的要求、适用规则、检查与发现。',
    ),
    targetUsers: [
      t('Food business operator', 'Оператор на хранителен бизнес', 'Оператор пищевого бизнеса', 'Exploitant alimentaire', 'Υπεύθυνος επιχείρησης τροφίμων', 'Operador alimentario', 'Lebensmittelunternehmer', 'Operador de negócio alimentício', '食品经营者'),
      t('Compliance specialist', 'Compliance специалист', 'Специалист по compliance', 'Spécialiste conformité', 'Ειδικός συμμόρφωσης', 'Especialista de compliance', 'Compliance-Spezialist', 'Especialista de compliance', '合规专员'),
      t('Facility manager', 'Мениджър на обект', 'Менеджер объекта', 'Responsable de site', 'Υπεύθυνος εγκατάστασης', 'Responsable de instalación', 'Standortmanager', 'Gerente de unidade', '设施负责人'),
      t('Auditor / reviewer', 'Одитор / Проверяващ', 'Аудитор / Проверяющий', 'Auditeur / Réviseur', 'Ελεγκτής / Αξιολογητής', 'Auditor / Revisor', 'Auditor / Prüfer', 'Auditor / Revisor', '审计员 / 复核人员'),
    ],
    architecture: ['DDD', 'CQRS', 'Modular Monolith', 'Rule-oriented domain model'],
    frontend: ['Modern web application'],
    backend: ['.NET', 'ASP.NET Core', 'Domain-centric APIs'],
    infrastructure: ['PostgreSQL / SQL storage', 'Observability', 'Documented compliance evidence'],
    engineeringHighlights: [
      t('Source → Provision → Requirement → Rule → Check → Finding traceability', 'Проследимост Source → Provision → Requirement → Rule → Check → Finding', 'Трассируемость Source → Provision → Requirement → Rule → Check → Finding', 'Traçabilité Source → Provision → Requirement → Rule → Check → Finding', 'Ιχνηλασιμότητα Source → Provision → Requirement → Rule → Check → Finding', 'Trazabilidad Source → Provision → Requirement → Rule → Check → Finding', 'Nachvollziehbarkeit Source → Provision → Requirement → Rule → Check → Finding', 'Rastreabilidade Source → Provision → Requirement → Rule → Check → Finding', 'Source → Provision → Requirement → Rule → Check → Finding 全链路追踪'),
      t('Facility, room and equipment modelling', 'Моделиране на обекти, помещения и оборудване', 'Моделирование объектов, помещений и оборудования', 'Modélisation des sites, pièces et équipements', 'Μοντελοποίηση εγκαταστάσεων, χώρων και εξοπλισμού', 'Modelado de instalaciones, salas y equipos', 'Modellierung von Standorten, Räumen und Geräten', 'Modelagem de instalações, salas e equipamentos', '设施、房间与设备建模'),
      t('Readiness indicators without presenting official approval', 'Индикатори за готовност без представяне като официално одобрение', 'Индикаторы готовности без выдачи их за официальное одобрение', 'Indicateurs de préparation sans les présenter comme une approbation officielle', 'Δείκτες ετοιμότητας χωρίς παρουσίαση ως επίσημη έγκριση', 'Indicadores de preparación sin presentarlos como aprobación oficial', 'Bereitschaftsindikatoren ohne Darstellung als behördliche Genehmigung', 'Indicadores de prontidão sem apresentá-los como aprovação oficial', '提供准备度指标，但不将其表述为官方批准'),
    ],
    documentationUrl: 'https://webuildssoftwaresolutions.gitbook.io/foodreg-documentation/',
    status: t('MVP domain development', 'Разработка на MVP домейна', 'Разработка MVP-домена', 'Développement du domaine MVP', 'Ανάπτυξη MVP domain', 'Desarrollo del dominio MVP', 'MVP-Domänenentwicklung', 'Desenvolvimento do domínio MVP', 'MVP 领域开发'),
  },
  {
    slug: 'rasm',
    name: 'RASM',
    domain: t('Regulated business compliance', 'Съответствие за регулиран бизнес', 'Compliance регулируемого бизнеса', 'Conformité des activités réglementées', 'Συμμόρφωση ρυθμιζόμενων επιχειρήσεων', 'Compliance para negocios regulados', 'Compliance für regulierte Unternehmen', 'Compliance para negócios regulados', '受监管业务合规'),
    shortDescription: t(
      'A compliance-first B2B operational platform for lawful regulated adult-service businesses.',
      'B2B оперативна платформа с compliance-first подход за законно регулирани adult-service бизнеси.',
      'B2B-операционная платформа с compliance-first подходом для легальных регулируемых adult-service бизнесов.',
      'Une plateforme opérationnelle B2B axée sur la conformité pour des activités adultes réglementées et légales.',
      'B2B λειτουργική πλατφόρμα με compliance-first προσέγγιση για νόμιμες ρυθμιζόμενες υπηρεσίες ενηλίκων.',
      'Plataforma operativa B2B con enfoque compliance-first para negocios legales y regulados de servicios para adultos.',
      'Eine Compliance-first B2B-Betriebsplattform für rechtmäßige regulierte Adult-Service-Unternehmen.',
      'Plataforma operacional B2B compliance-first para negócios legais e regulados de serviços adultos.',
      '面向合法受监管成人服务企业的 B2B 运营平台，以合规为首要原则。',
    ),
    problem: t(
      'Models jurisdictions, licensing, workforce, operations and evidence so regulated actions remain lawful, privacy-aware and auditable.',
      'Моделира юрисдикции, лицензиране, персонал, операции и доказателства, така че регулираните действия да са законни, privacy-aware и одитируеми.',
      'Моделирует юрисдикции, лицензирование, персонал, операции и доказательства, чтобы регулируемые действия оставались законными, учитывали приватность и поддавались аудиту.',
      'Modélise juridictions, licences, personnel, opérations et preuves afin que les actions réglementées restent légales, respectueuses de la vie privée et auditables.',
      'Μοντελοποιεί δικαιοδοσίες, αδειοδότηση, προσωπικό, λειτουργίες και αποδεικτικά ώστε οι ρυθμιζόμενες ενέργειες να παραμένουν νόμιμες, privacy-aware και ελέγξιμες.',
      'Modela jurisdicciones, licencias, personal, operaciones y evidencias para que las acciones reguladas sean legales, respeten la privacidad y sean auditables.',
      'Modelliert Rechtsräume, Lizenzen, Personal, Betrieb und Nachweise, damit regulierte Vorgänge rechtmäßig, datenschutzbewusst und auditierbar bleiben.',
      'Modela jurisdições, licenças, equipes, operações e evidências para que ações reguladas permaneçam legais, conscientes de privacidade e auditáveis.',
      '对司法辖区、许可、人员、运营与证据进行建模，使受监管行为保持合法、注重隐私并可审计。',
    ),
    targetUsers: [
      t('Regulated organization', 'Регулирана организация', 'Регулируемая организация', 'Organisation réglementée', 'Ρυθμιζόμενος οργανισμός', 'Organización regulada', 'Regulierte Organisation', 'Organização regulada', '受监管组织'),
      t('Compliance team', 'Compliance екип', 'Команда compliance', 'Équipe conformité', 'Ομάδα συμμόρφωσης', 'Equipo de compliance', 'Compliance-Team', 'Equipe de compliance', '合规团队'),
      t('Operations team', 'Оперативен екип', 'Операционная команда', 'Équipe opérations', 'Ομάδα λειτουργιών', 'Equipo de operaciones', 'Operations-Team', 'Equipe de operações', '运营团队'),
      t('Auditor', 'Одитор', 'Аудитор', 'Auditeur', 'Ελεγκτής', 'Auditor', 'Auditor', 'Auditor', '审计员'),
    ],
    architecture: ['DDD', 'CQRS', 'Modular architecture', 'Effective-dated rules', 'Multi-tenancy'],
    frontend: ['Enterprise web application'],
    backend: ['.NET', 'Policy-driven domain services'],
    infrastructure: ['Auditability', 'Privacy-aware data design', 'Compliance evidence'],
    engineeringHighlights: [
      t('Jurisdiction-aware policy modelling', 'Моделиране на политики според юрисдикцията', 'Моделирование политик с учетом юрисдикции', 'Modélisation des politiques selon la juridiction', 'Μοντελοποίηση πολιτικών ανά δικαιοδοσία', 'Modelado de políticas según jurisdicción', 'Jurisdiktionsabhängige Richtlinienmodellierung', 'Modelagem de políticas por jurisdição', '基于司法辖区的策略建模'),
      t('Effective-dated regulatory rules', 'Нормативни правила с период на валидност', 'Регуляторные правила с периодом действия', 'Règles réglementaires à dates d’effet', 'Κανονιστικοί κανόνες με χρονική ισχύ', 'Reglas regulatorias con vigencia temporal', 'Regulatorische Regeln mit Gültigkeitszeitraum', 'Regras regulatórias com vigência temporal', '带生效时间的监管规则'),
      t('Consent, privacy and auditability as domain constraints', 'Съгласие, поверителност и одитируемост като домейн ограничения', 'Согласие, приватность и аудитируемость как доменные ограничения', 'Consentement, confidentialité et auditabilité comme contraintes métier', 'Συναίνεση, ιδιωτικότητα και auditability ως domain constraints', 'Consentimiento, privacidad y auditabilidad como restricciones de dominio', 'Einwilligung, Datenschutz und Auditierbarkeit als Domänenrestriktionen', 'Consentimento, privacidade e auditabilidade como restrições de domínio', '将同意、隐私与可审计性作为领域约束'),
    ],
    documentationUrl: 'https://webuildssoftwaresolutions.gitbook.io/rasm-documentation/',
    status: t('Architecture and product development', 'Архитектура и продуктова разработка', 'Архитектура и продуктовая разработка', 'Architecture et développement produit', 'Αρχιτεκτονική και ανάπτυξη προϊόντος', 'Arquitectura y desarrollo de producto', 'Architektur und Produktentwicklung', 'Arquitetura e desenvolvimento de produto', '架构与产品开发'),
  },
  {
    slug: 'qwen-hosting',
    name: 'QWEN Hosting',
    domain: t('Multi-tenant AI gateway', 'Мултитенантен AI gateway', 'Мультитенантный AI-шлюз', 'Passerelle IA multi-tenant', 'Multi-tenant AI gateway', 'Gateway de IA multi-tenant', 'Multi-Tenant-KI-Gateway', 'Gateway de IA multi-tenant', '多租户 AI 网关'),
    shortDescription: t(
      'A private shared AI backend that centralizes model access, tenant/application context, tools, RAG and observability.',
      'Частен споделен AI backend, който централизира достъпа до модели, tenant/application контекст, инструменти, RAG и наблюдаемост.',
      'Частный общий AI-backend, централизующий доступ к моделям, контекст tenant/application, инструменты, RAG и наблюдаемость.',
      'Un backend IA privé et partagé qui centralise l’accès aux modèles, le contexte tenant/application, les outils, le RAG et l’observabilité.',
      'Ιδιωτικό κοινόχρηστο AI backend που συγκεντρώνει πρόσβαση σε μοντέλα, tenant/application context, εργαλεία, RAG και observability.',
      'Backend privado y compartido de IA que centraliza acceso a modelos, contexto tenant/application, herramientas, RAG y observabilidad.',
      'Ein privates gemeinsames KI-Backend, das Modellzugriff, Tenant-/Application-Kontext, Tools, RAG und Observability zentralisiert.',
      'Backend privado e compartilhado de IA que centraliza acesso a modelos, contexto tenant/application, ferramentas, RAG e observabilidade.',
      '私有共享 AI 后端，集中管理模型访问、租户/应用上下文、工具、RAG 与可观测性。',
    ),
    problem: t(
      'Provides one governed AI gateway for multiple applications while keeping model/runtime choices replaceable and policy-driven.',
      'Осигурява един управляван AI gateway за множество приложения, като моделите и runtime-ите остават заменяеми и policy-driven.',
      'Предоставляет единый управляемый AI-шлюз для нескольких приложений, сохраняя заменяемость моделей и runtime и управление политиками.',
      'Fournit une passerelle IA gouvernée pour plusieurs applications tout en gardant modèles et runtimes remplaçables et pilotés par politiques.',
      'Παρέχει ένα ελεγχόμενο AI gateway για πολλές εφαρμογές, διατηρώντας μοντέλα και runtimes αντικαταστάσιμα και policy-driven.',
      'Proporciona un gateway de IA gobernado para varias aplicaciones manteniendo modelos y runtimes reemplazables y guiados por políticas.',
      'Bietet ein gesteuertes KI-Gateway für mehrere Anwendungen, während Modelle und Runtimes austauschbar und richtliniengesteuert bleiben.',
      'Fornece um gateway de IA governado para várias aplicações, mantendo modelos e runtimes substituíveis e orientados por políticas.',
      '为多个应用提供统一受控的 AI 网关，同时保持模型与运行时可替换并由策略驱动。',
    ),
    targetUsers: [
      t('Internal product teams', 'Вътрешни продуктови екипи', 'Внутренние продуктовые команды', 'Équipes produit internes', 'Εσωτερικές ομάδες προϊόντος', 'Equipos internos de producto', 'Interne Produktteams', 'Equipes internas de produto', '内部产品团队'),
      t('Tenant applications', 'Tenant приложения', 'Tenant-приложения', 'Applications tenant', 'Tenant εφαρμογές', 'Aplicaciones tenant', 'Tenant-Anwendungen', 'Aplicações tenant', '租户应用'),
      t('AI-enabled services', 'Услуги с AI', 'Сервисы с AI', 'Services enrichis par IA', 'Υπηρεσίες με AI', 'Servicios con IA', 'KI-gestützte Dienste', 'Serviços com IA', 'AI 驱动服务'),
    ],
    architecture: ['Multi-tenancy', 'AI Gateway', 'Model routing', 'Tools', 'RAG', 'Local-first inference'],
    frontend: ['Administration / observability surfaces'],
    backend: ['Gateway APIs', 'Policy / model router', 'Tool orchestration'],
    infrastructure: ['Local models', 'Cloud fallback', 'Observability', 'Cost-awareness'],
    engineeringHighlights: [
      t('Application → AI Gateway → Policy / Model Router → Model / Tools / RAG', 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG', 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG', 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG', 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG', 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG', 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG', 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG', 'Application → AI Gateway → Policy / Model Router → Model / Tools / RAG'),
      t('Local-first inference with cloud fallback', 'Local-first inference с cloud fallback', 'Local-first inference с облачным fallback', 'Inférence local-first avec repli cloud', 'Local-first inference με cloud fallback', 'Inferencia local-first con fallback en la nube', 'Local-first Inference mit Cloud-Fallback', 'Inferência local-first com fallback na nuvem', '本地优先推理并支持云端回退'),
      t('Model/runtime independence across applications', 'Независимост от конкретен model/runtime между приложенията', 'Независимость приложений от конкретной модели/runtime', 'Indépendance modèle/runtime entre applications', 'Ανεξαρτησία model/runtime μεταξύ εφαρμογών', 'Independencia de modelo/runtime entre aplicaciones', 'Modell-/Runtime-Unabhängigkeit über Anwendungen hinweg', 'Independência de modelo/runtime entre aplicações', '跨应用保持模型/运行时独立'),
    ],
    documentationUrl: 'https://webuildssoftwaresolutions.gitbook.io/qwen-hosting-documentation/',
    status: t('Platform engineering', 'Платформена разработка', 'Платформенная разработка', 'Ingénierie de plateforme', 'Μηχανική πλατφόρμας', 'Ingeniería de plataforma', 'Platform Engineering', 'Engenharia de plataforma', '平台工程'),
  },
] as const;

export function localized(text: LocalizedText, locale: LocaleCode | string | null | undefined): string {
  const localeCode = locale as LocaleCode | null | undefined;
  return localeCode && text[localeCode] ? text[localeCode] : text.en;
}

export function findProject(slug: string | null): ProjectSummary | undefined {
  return projectCatalog.find((project) => project.slug === slug);
}
