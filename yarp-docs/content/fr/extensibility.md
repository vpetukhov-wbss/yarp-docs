---
slug: extensibility
title: Présentation
lede: >-
  YARP propose 2 principaux styles d'extensibilité, selon le comportement de routage souhaité :
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility
lastUpdated: 2026-08-11
---

## Présentation de l'extensibilité de YARP

YARP propose 2 principaux styles d'extensibilité, selon le comportement de routage souhaité :

Pipeline de middleware Http Forwarder

## Pipeline de middleware

YARP repose sur les concepts de routes, de clusters et de destinations. Ceux-ci peuvent être fournis via des fichiers de configuration ou directement en code. En fonction des règles de routage, YARP sélectionne un cluster et énumère les destinations possibles. Il utilise ensuite le pipeline de middleware pour sélectionner la destination en fonction de l'intégrité des destinations, de l'affinité de session, de la répartition de charge, etc.

La majeure partie du pipeline prédéfini peut être personnalisée en code :

Fournisseurs de configuration Énumération des destinations Affinité de session Répartition de charge Contrôles d'intégrité Transformations de requête Configuration de HttpClient

Vous pouvez également modifier la définition du pipeline pour remplacer des modules par vos propres implémentations ou ajouter des modules supplémentaires selon vos besoins. Pour plus d'informations, consultez Middleware.

## HTTP Forwarder

Si le pipeline de YARP est trop rigide pour votre cas d'usage, ou si l'ampleur des règles de routage et des destinations ne se prête pas à un chargement en mémoire, vous pouvez implémenter votre propre logique de routage et utiliser le HTTP Forwarder pour diriger les requêtes vers la destination de votre choix. Le composant HttpForwarder prend le contexte HTTP et transmet la requête à la destination fournie.

Le composant de transformation peut toujours être utilisé si le forwarder est nécessaire. Pour plus d'informations, consultez Transfert direct.

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
