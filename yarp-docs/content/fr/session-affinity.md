---
slug: session-affinity
title: Affinité de session
lede: >-
  L'affinité de session est un mécanisme permettant de lier (affinitiser) une séquence de requêtes
  causalement liées à la
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/session-affinity
lastUpdated: 2026-08-11
---

## Concept

L'affinité de session est un mécanisme permettant de lier (affinitiser) une séquence de requêtes causalement liées à la destination qui a traité la première requête, lorsque la charge est répartie entre plusieurs destinations. Elle est utile dans les scénarios où la plupart des requêtes d'une séquence exploitent les mêmes données et où le coût d'accès aux données diffère selon le nœud (la destination) qui traite la requête. L'exemple le plus courant est une mise en cache transitoire (par exemple en mémoire), où la première requête récupère les données depuis un stockage persistant plus lent vers un cache local rapide, tandis que les requêtes suivantes n'exploitent que les données mises en cache, ce qui augmente le débit.

## Configuration

## Services et enregistrement du middleware

Les services d'affinité de session sont enregistrés automatiquement dans le conteneur d'injection de dépendances par AddReverseProxy() . Le middleware UseSessionAffinity() est inclus par défaut dans la méthode MapReverseProxy sans paramètre. Si vous personnalisez le pipeline du proxy, placez ce middleware avant d'ajouter UseLoadBalancing() .

Exemple :

```csharp
   app.MapReverseProxy(proxyPipeline =>
   {
          proxyPipeline.UseSessionAffinity();
          proxyPipeline.UseLoadBalancing();
   });
Note Some session affinity implementations depend on Data Protection, which will require
additional configuration for scenarios like multiple proxy instances. See Key Protection for
details.
```

## Configuration du cluster

L'affinité de session se configure par cluster selon le schéma de configuration suivant.

```json
"ReverseProxy": {
   "Clusters": {
      "<cluster-name>": {
         "SessionAffinity": {
             "Enabled": "(true|false)", // defaults to 'false'
             "Policy": "(HashCookie|ArrCookie|Cookie|CustomHeader)", // defaults to
'HashCookie'
             "FailurePolicy": "(Redistribute|Return503Error)", // defaults to
'Redistribute'
             "AffinityKeyName": "Key1",
             "Cookie": {
                "Domain": "localhost",
                "Expiration": "03:00:00",
                "HttpOnly": true,
                "IsEssential": true,
                "MaxAge": "1.00:00:00",
                "Path": "mypath",
                "SameSite": "Strict",
                "SecurePolicy": "Always"
             }
         }
      }
   }
}
```

## Configuration du cookie

Les attributs de configuration du cookie utilisé par les politiques HashCookie, ArrCookie et Cookie peuvent être définis via SessionAffinityCookieConfig . Ces propriétés peuvent être configurées en JSON comme ci-dessus, ou en code comme indiqué ci-dessous :

```csharp
new ClusterConfig
{
      ClusterId = "cluster1",
      SessionAffinity = new SessionAffinityConfig
      {
             Enabled = true,
             FailurePolicy = "Return503Error",
             Policy = "HashCookie",
             AffinityKeyName = "Key1",
             Cookie = new SessionAffinityCookieConfig
             {
                   Domain = "mydomain",
                   Expiration = TimeSpan.FromHours(3),
                   HttpOnly = true,
                   IsEssential = true,
                   MaxAge = TimeSpan.FromDays(1),
                      Path = "mypath",
                      SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict,
                      SecurePolicy =
Microsoft.AspNetCore.Http.CookieSecurePolicy.SameAsRequest
                   }
   }
}
```

## Clé d'affinité

L'affinité entre une requête et une destination est établie via la clé d'affinité identifiant la destination cible. Cette clé peut être stockée dans différentes parties de la requête selon l'implémentation de l'affinité de session utilisée, mais chaque requête ne peut porter qu'une seule clé de ce type. La sémantique exacte de la clé dépend de l'implémentation, mais les politiques intégrées utilisent actuellement DestinationId comme clé d'affinité.

La conception actuelle n'exige pas que la clé identifie de manière unique une seule destination affinitisée. Il est possible d'établir une affinité vers un groupe de destinations. Dans ce cas, la destination exacte chargée de traiter la requête donnée sera déterminée par le répartiteur de charge.

Établissement d'une nouvelle affinité ou résolution d'une affinité existante

Lorsqu'une requête arrive et est routée vers un cluster dont l'affinité de session est activée, le proxy détermine automatiquement s'il doit établir une nouvelle affinité ou résoudre une affinité existante, en fonction de la présence et de la validité d'une clé d'affinité sur la requête, comme suit :

1. La requête ne contient pas de clé. La résolution est ignorée et une nouvelle affinité est établie vers la destination choisie par le répartiteur de charge

2. Une clé d'affinité valide est trouvée sur la requête. Le mécanisme d'affinité tente de trouver toutes les destinations saines correspondant à la clé et, s'il en trouve, transmet la requête plus loin dans le pipeline. Si plusieurs destinations correspondantes sont trouvées, le répartiteur de charge est invoqué pour choisir la destination cible unique. Si une seule destination correspondante est trouvée, le répartiteur de charge n'intervient pas.

3. La clé d'affinité est invalide, ou aucune destination affinitisée saine n'est trouvée. Ce cas est traité comme un échec, géré par une politique d'échec expliquée ci-dessous

Si une nouvelle affinité a été établie pour la requête, la clé d'affinité est attachée à une réponse, sa représentation et son emplacement exacts dépendant de l'implémentation. Il existe actuellement deux politiques intégrées qui stockent la clé dans un cookie ou un en-tête personnalisé. Une fois la réponse

livrée au client, il incombe à celui-ci de joindre la clé à toutes les requêtes suivantes de

la même session. Ensuite, lorsque la requête suivante portant la clé arrive au proxy, celui-ci

résout l'affinité existante, mais la clé d'affinité n'est pas rattachée de nouveau à la réponse. Ainsi,

seule la première réponse porte la clé d'affinité.

Il existe quatre politiques d'affinité intégrées qui formatent et stockent la clé différemment sur les requêtes et les réponses. La politique par défaut est HashCookie .

Les politiques HashCookie , ArrCookie et Cookie stockent la clé dans un cookie, respectivement hachée ou chiffrée - voir Protection de la clé ci-dessous. La clé de la requête est transmise sous la forme d'un cookie portant le nom configuré, et ce même cookie est défini via l'en-tête Set-Cookie sur la première réponse d'une séquence affinitisée. Le nom du cookie doit être défini explicitement via SessionAffinityConfig.AffinityKeyName . Les autres propriétés du cookie peuvent être configurées via SessionAffinityCookieConfig . CustomHeader stocke la clé dans un en-tête chiffré. Elle attend que la clé d'affinité soit transmise dans un en-tête personnalisé portant le nom configuré, et définit ce même en-tête sur la première réponse d'une séquence affinitisée. Le nom de l'en-tête doit être défini via SessionAffinityConfig.AffinityKeyName .

:::note
AffinityKeyName doit être unique parmi tous les clusters ayant l'affinité de session activée, afin d'éviter les conflits.
:::

## Protection de la clé

La politique HashCookie utilise le hachage XxHash64 pour produire un format de sortie rapide, compact et obscurci pour la valeur du cookie.

La politique ArrCookie utilise le hachage SHA-256 pour produire une sortie obscurcie de la valeur du cookie, compatible avec le format du cookie d'affinité ARR d'IIS. ARR utilise le nom d'hôte de la destination comme valeur d'entrée ; les identifiants de destination de YARP devraient donc être configurés en conséquence s'ils sont utilisés conjointement avec ARR.

HashCookie et ArrCookie n'offrent pas une protection forte de la confidentialité ; les identifiants de destination ne doivent donc pas contenir de données sensibles. Ces politiques ne dissimulent pas non plus le nombre total de destinations uniques derrière le proxy et ne devraient pas être utilisées si ce point constitue un enjeu.

Les politiques Cookie et CustomHeader chiffrent la clé à l'aide de Data Protection. Cela offre une forte protection de la confidentialité pour la clé, mais nécessite une configuration supplémentaire lorsque plusieurs instances du proxy sont utilisées.

## Politique d'échec d'affinité

Si la clé d'affinité ne peut pas être décodée ou si aucune destination saine n'est trouvée, cela est considéré comme un

échec, et une politique d'échec d'affinité est appelée pour le traiter. Cette politique dispose d'un accès complet à

HttpContext et peut envoyer elle-même une réponse au client. Elle renvoie une valeur booléenne indiquant

si le traitement de la requête peut se poursuivre dans le pipeline ou doit être interrompu.

Il existe deux politiques d'échec intégrées. La politique par défaut est Redistribute .

1. Redistribute - tente d'établir une nouvelle affinité vers l'une des destinations saines disponibles en ignorant l'étape de recherche d'affinité et en transmettant toutes les destinations saines au répartiteur de charge, de la même façon que pour une requête sans aucune affinité. Le traitement de la requête se poursuit. Cette politique est implémentée par RedistributeAffinityFailurePolicy .

2. Return503Error - renvoie une réponse 503 au client et le traitement de la requête est interrompu. Cette politique est implémentée par Return503ErrorAffinityFailurePolicy

## Pipeline de requêtes

Les mécanismes d'affinité de session sont implémentés par les services (mentionnés ci-dessus) et les deux middlewares suivants :

1. SessionAffinityMiddleware - coordonne le processus de résolution de l'affinité de la requête. Il appelle d'abord la politique spécifiée pour le cluster donné via la propriété ClusterConfig.SessionAffinity.Policy. Il vérifie ensuite le statut de résolution d'affinité renvoyé par la politique, et appelle en cas d'échec une politique de gestion des échecs définie via ClusterConfig.SessionAffinity.FailurePolicy. Il doit être ajouté au pipeline avant le répartiteur de charge.

2. AffinitizeTransform - définit la clé sur la réponse si une nouvelle affinité a été établie pour la requête. Sinon, si la requête suit une affinité existante, elle ne fait rien. Cette transformation est ajoutée automatiquement en tant que transformation de réponse.

:::note
Cet article a été rédigé par l'auteur avec l'aide de l'IA. En savoir plus
:::
