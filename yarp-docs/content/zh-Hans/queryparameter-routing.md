---
slug: queryparameter-routing
title: 基于查询参数的路由
lede: >-
  无论是在配置中指定,还是通过代码指定,代理路由都必须至少包含一个用于匹配的路径或主机。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/queryparameter-routing
lastUpdated: 2026-08-11
---

## YARP 基于查询参数的路由

无论是在配置中指定,还是通过代码指定,代理路由都必须至少包含一个用于匹配的路径或主机。除此之外,路由还可以指定一个或多个必须出现在请求中的查询参数。

## 优先级

默认的路由匹配优先级顺序为:1)路径,2)方法,3)主机,4)标头,5)查询参数。这意味着,一个指定了方法但未指定查询参数的路由,会先于一个指定了查询参数但未指定方法的路由被匹配。可以通过在路由上设置 Order 属性来覆盖这一默认顺序。

## 配置

查询参数在代理路由的 Match 部分中指定。

如果在一个路由上指定了多条查询参数规则,则必须全部匹配,该路由才会被采用。若要实现"或"逻辑,则必须在单条查询参数规则内部实现,或者拆分为多个独立的路由来实现。

配置:

```json
"Routes": {
   "route1" : {
      "ClusterId": "cluster1",
      "Match": {
         "Path": "{**catch-all}",
         "QueryParameters": [
             {
                "Name": "queryparam1",
                "Values": [ "value1" ],
                "Mode": "Exact"
             }
         ]
      }
   },
   "route2" : {
      "ClusterId": "cluster1",
      "Match": {
         "Path": "{**catch-all}",
         "QueryParameters": [
             {
                          "Name": "queryparam2",
                          "Values": [ "1prefix", "2prefix" ],
                          "Mode": "Prefix"
                      }
                   ]
}
},
"route3" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam3",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route4" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam4",
                          "Values": [ "value1", "value2" ],
                          "Mode": "Exact"
                      },
                      {
                          "Name": "queryparam5",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route5" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam5",
                          "Values": [ "value1", "value2" ],
                          "Mode": "Contains"
                      },
                      {
                          "Name": "queryparam6",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route6" : {
"ClusterId": "cluster1",
       "Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam6",
                          "Values": [ "value1", "value2" ],
                          "Mode": "NotContains"
                      },
                      {
                          "Name": "queryparam7",
                          "Mode": "Exists"
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
                   QueryParameters = new[]
                   {
                          new RouteQueryParameter()
                          {
                                 Name = "QueryParam1",
                                 Values = new[] { "value1" },
                                 Mode = QueryParameterMatchMode.Exact
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
                   QueryParameters = new[]
                   {
                          new RouteQueryParameter()
                          {
                                 Name = "QueryParam2",
                             Values = new[] { "1prefix", "2prefix" },
                             Mode = QueryParameterMatchMode.Prefix
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
                      QueryParameters = new[]
                      {
                         new RouteQueryParameter()
                         {
                             Name = "QueryParam3",
                             Mode = QueryParameterMatchMode.Exists
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
                      QueryParameters = new[]
                      {
                      new RouteQueryParameter()
                         {
                             Name = "QueryParam4",
                             Values = new[] { "value1", "value2" },
                             Mode = QueryParameterMatchMode.Exact
                         },
                         new RouteQueryParameter()
                         {
                             Name = "QueryParam5",
                             Mode = QueryParameterMatchMode.Exists
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
                      QueryParameters = new[]
                      {
                         new RouteQueryParameter()
                         {
                            Name = "QueryParam5",
                            Values = new[] { "value1", "value2" },
                            Mode = QueryParameterMatchMode.Contains
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
                      QueryParameters = new[]
                      {
                         new RouteQueryParameter()
                         {
                            Name = "QueryParam6",
                            Values = new[] { "value1", "value2" },
                            Mode = QueryParameterMatchMode.NotContains
                         }
                      }
                   }
    }
};
```

## 协定

RouteQueryParameter 定义了代码协定,并从配置中进行映射。

## 名称

要在请求上检查的查询参数名称。必须为非空值。该字段不区分大小写。

## 值

要查找的一组可能取值的列表。除 'NotContains' 之外,查询参数必须根据指定的 Mode 至少匹配这些值中的一个。除非 Mode 设置为 Exists,否则至少需要提供一个值。

## 模式

QueryParameterMatchMode 指定了应如何将这些值与请求中的查询参数进行匹配。默认值为 Exact。

Exact——查询参数必须完整匹配,是否区分大小写取决于 IsCaseSensitive 的值。仅支持单个查询参数;如果存在多个同名查询参数,则匹配失败。Prefix——查询参数必须按前缀匹配,是否区分大小写取决于 IsCaseSensitive 的值。仅支持单个查询参数;如果存在多个同名查询参数,则匹配失败。Exists——该查询参数必须存在且包含任意非空值。Contains——查询参数必须包含该值才算匹配,是否区分大小写取决于 IsCaseSensitive 的值。仅支持单个查询参数;如果存在多个同名查询参数,则匹配失败。NotContains——查询参数不得包含任何一个匹配值,是否区分大小写取决于 IsCaseSensitive 的值。仅支持单个查询参数;如果存在多个同名查询参数,则匹配失败。

## IsCaseSensitive

指示值匹配是否区分大小写。默认值为 false,即不区分大小写。

## 编码

请求的查询字符串会先经过解析和解码,然后再与路由规则进行匹配。

"route8" : { "ClusterId": "cluster1", "Match": { "Path": "{**catch-all}", "QueryParameters": [ { "Name": "queryparam8", "Values": [ "another value" ], "Mode": "Exact" } ] }

匹配以下情况:

?queryparam8=another%20value

或

?queryparam8=another+value

## 示例

以下示例均使用上文指定的配置。

## 场景 1 - 精确查询参数匹配

带有以下查询参数的请求将匹配 route1。

?QueryParam1=Value1

目前不支持多个同名查询参数,因此不会匹配。

?QueryParam1=Value1&QueryParam1=Value2

## 场景 2 - 多个值

route2 为要在查询参数中查找的值定义了多个候选值("1prefix"、"2prefix"),其中任意一个都可以接受。它还将 Mode 指定为 Prefix,因此任何以这些值开头的查询参数都可以接受。以下任意一个查询参数都会匹配 route2。

?QueryParam2=1prefix

?QueryParam2=2prefix

?QueryParam2=1prefix-extra

?QueryParam2=2prefix-extra

目前不支持多个同名查询参数,因此不会匹配。

?QueryParam2=2prefix&QueryParam2=1prefix

## 场景 3 - Exists

route3 只要求查询参数 "QueryParam3" 存在且包含任意非空值。以下是一个会匹配 route3 的示例。

?QueryParam3=value

空查询参数不会匹配。

?QueryParam3 ?QueryParam3=

由于该模式并不检查查询参数的具体内容,因此它确实支持包含多个值的查询参数,以及多个同名查询参数。以下情况将会匹配。

?QueryParam3=value1&QueryParam3=value2

## 场景 4 - 多个查询参数

route4 要求 QueryParam4 和 QueryParam5 同时存在,并分别按照各自指定的 Mode 进行匹配。以下查询参数组合将匹配 route4:

?QueryParam4=value1&QueryParam5=AnyValue

?QueryParam4=value2&QueryParam5=AnyValue

以下查询参数组合不会匹配 route4,因为它们缺少其中一个必需的查询参数:

?QueryParam4=value2

?QueryParam5=AnyValue 注意:本文作者在 AI 的协助下创作本文。了解详情
