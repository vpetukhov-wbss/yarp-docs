---
slug: header-routing
title: Header-based routing
lede: >-
  Proxy routes specified in config or via code must include at least a path or host to match
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-routing
lastUpdated: 2026-08-11
---

## YARP Header Based Routing {#yarp-header-based-routing}

Proxy routes specified in config or via code must include at least a path or host to match against. In addition to these, a route can also specify one or more headers that must be present on the request.

## Precedence {#precedence}

The default route match precedence order is

1. path
1. method
1. host
1. headers
1. query parameters

That means a route which specifies methods and no headers will match before a route which specifies headers and no methods. This can be overridden by setting the Order property on a route (see example in config properties).

## Configuration {#configuration}

Headers are specified in the Match section of a proxy route.

If multiple headers rules are specified on a route then all must match for a route to be taken. OR logic must be implemented either within a header rule or as separate routes.

Configuration:

```json
"Routes": {
   "route1" : {
      "ClusterId": "cluster1",
      "Match": {
         "Path": "{**catch-all}",
         "Headers": [
             {
                "Name": "header1",
                "Values": [ "value1" ],
                "Mode": "ExactHeader"
             }
         ]
      }
},
"route2" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header2",
                          "Values": [ "1prefix", "2prefix" ],
                          "Mode": "HeaderPrefix"
                      }
                   ]
}
},
"route3" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header3",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route4" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header4",
                          "Values": [ "value1", "value2" ],
                          "Mode": "ExactHeader"
                      },
                      {
                          "Name": "header5",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route5" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header5",
                          "Values": [ "value1", "value2" ],
                          "Mode": "Contains"
                      },
                      {
                          "Name": "header6",
                          "Mode": "Exists"
                      }
                   ]
       }
    },
    "route6" : {
       "ClusterId": "cluster1",
       "Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header6",
                          "Values": [ "value1", "value2" ],
                          "Mode": "NotContains"
                      },
                      {
                          "Name": "header7",
                          "Mode": "Exists"
                      }
                   ]
       }
    },
    "route7" : {
       "ClusterId": "cluster1",
       "Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header7",
                          "Mode": "NotExists"
                      }
                   ]
       }
    }
}
Code:
```

```csharp
var routes = new[]
{
      new RouteConfig()
      {
             RouteId = "route1",
             ClusterId = "cluster1",
             Match = new RouteMatch
             {
                   Path = "{**catch-all}",
                   Headers = new[]
                   {
                          new RouteHeader()
                          {
                            Name = "Header1",
                            Values = new[] { "value1" },
                            Mode = HeaderMatchMode.ExactHeader
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route2",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header2",
                            Values = new[] { "1prefix", "2prefix" },
                            Mode = HeaderMatchMode.HeaderPrefix
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route3",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header3",
                            Mode = HeaderMatchMode.Exists
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route4",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header4",
                            Values = new[] { "value1", "value2" },
                             Mode = HeaderMatchMode.ExactHeader
                         },
                         new RouteHeader()
                         {
                             Name = "Header5",
                             Mode = HeaderMatchMode.Exists
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route5",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                             Name = "Header5",
                             Values = new[] { "value1", "value2" },
                             Mode = HeaderMatchMode.Contains
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route6",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                             Name = "Header6",
                             Values = new[] { "value1", "value2" },
                             Mode = HeaderMatchMode.NotContains
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route7",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header7",
                            Mode = HeaderMatchMode.NotExists
                         }
                      }
                   }
    }
};
```

## Contract {#contract}

RouteHeader defines the code contract and is mapped from config.

## Name {#name}

The header name to check for on the request. A non-empty value is required. This field is case- insensitive per the HTTP RFCs.

## Values {#values}

A list of possible values to search for. The header must match at least one of these values according to the specified Mode except for the 'NotContains'. At least one value is required unless Mode is set to Exists or NotExists .

## Mode {#mode}

HeaderMatchMode specifies how to match the value(s) against the request header. The default is ExactHeader .

ExactHeader - Any of the headers with the given name must match in its entirety, subject to the value of IsCaseSensitive . If a header contains multiple values (separated by , or ; ), they are split before matching. A single pair of quotes will also be stripped from the value before matching. HeaderPrefix - Any of the headers with the given name must match by prefix, subject to the value of IsCaseSensitive . If a header contains multiple values (separated by , or ; ), they are split before matching. A single pair of quotes will also be stripped from the value before matching. Exists - The header must exist and contain any non-empty value. If there are multiple headers with the same name, the rule will also match.

Contains - Any of the headers with the given name must contain any of the match values,

subject to the value of IsCaseSensitive .

NotContains - None of the headers with the given name may contain any of the match

values, subject to the value of IsCaseSensitive .

## IsCaseSensitive {#iscasesensitive}

Indicates if the value match should be performed as case sensitive or insensitive. The default is false , insensitive.

## Examples {#examples}

These examples use the configuration specified above.

## Scenario 1 - Exact Header Match {#scenario-1-exact-header-match}

A request with the following header will match against route1.

Header1: Value1

If a header contains multiple values, each one will be matched separately. The following request will match.

Header1: Value1, Value2

The same holds if multiple values are split across multiple headers with the same name.

Header1: Value1 Header1: Value2

A single pair of enclosing quotes may be stripped from the value before matching. The following request will match.

Header1: "Value1"

Multiple pairs of quotes will not match.

Header1: ""Value1""

## Scenario 2 - Multiple Values {#scenario-2-multiple-values}

Route2 defined multiple values to search for in a header ("1prefix", "2prefix"), any of the values are acceptable. It also specified the Mode as HeaderPrefix , so any header that starts with those values is acceptable. Any of the following headers will match route2.

Header2: 1prefix

Header2: 2prefix

Header2: 1prefix-extra

Header2: 2prefix-extra

If a header contains multiple values, each one will be matched separately. The following request will match.

Header2: foo, 1prefix, 2prefix

The same holds if multiple values are split across multiple headers with the same name.

Header2: 1prefix Header2: 2prefix

A single pair of enclosing quotes may be stripped from the value before matching. The following request will match.

Header2: "2prefix"

Multiple pairs of quotes will not match.

Header2: ""2prefix""

## Scenario 3 - Exists {#scenario-3-exists}

Route3 only requires that the header "Header3" exists with any non-empty value The following is an example that will match route3.

Header3: value

An empty header will not match.

Header3:

This mode does support headers with multiple values and multiple headers with the same name since it does not look at the header contents. The following will match.

Header3: value1, value2

Header3: value1 Header3: value2

Header3: Header3:

## Scenario 4 - Multiple Headers {#scenario-4-multiple-headers}

Route4 requires both header4 and header5 , each matching according to their specified Mode . The following headers will match route4:

Header4: value1 Header5: AnyValue

Header4: value2 Header5: AnyValue

These will not match route4 because they are missing one of the required headers:

Header4: value2

Header5: AnyValue

## Scenario 5 - NotExists {#scenario-5-notexists}

Route7 requires that the header "Header7" must not exists The following headers will match route7:

NotHeader7: AnyValue

The following headers will not match route7 because the header "Header7" exists.

Header7: AnyValue

Header7: Note: The author created this article with assistance from AI. Learn more
