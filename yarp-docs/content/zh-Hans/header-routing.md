---
slug: header-routing
title: 基于标头的路由
lede: >-
  无论是在配置中指定,还是通过代码指定,代理路由都必须至少包含一个用于匹配的路径或主机。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-routing
lastUpdated: 2026-08-11
---

## YARP 基于标头的路由

无论是在配置中指定,还是通过代码指定,代理路由都必须至少包含一个用于匹配的路径或主机。除此之外,路由还可以指定一个或多个必须出现在请求中的标头。

## 优先级

默认的路由匹配优先级顺序为:

1. 路径
1. 方法
1. 主机
1. 标头
1. 查询参数

这意味着,一个指定了方法但未指定标头的路由,会先于一个指定了标头但未指定方法的路由被匹配。可以通过在路由上设置 Order 属性来覆盖这一默认顺序(参见配置属性中的示例)。

## 配置

标头在代理路由的 Match 部分中指定。

如果在一个路由上指定了多条标头规则,则必须全部匹配,该路由才会被采用。若要实现"或"逻辑,则必须在单条标头规则内部实现,或者拆分为多个独立的路由来实现。

配置:

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

## 协定

RouteHeader 定义了代码协定,并从配置中进行映射。

## 名称

要在请求上检查的标头名称。必须为非空值。根据 HTTP RFC 的规定,该字段不区分大小写。

## 值

要查找的一组可能取值的列表。除 'NotContains' 之外,标头必须根据指定的 Mode 至少匹配这些值中的一个。除非 Mode 设置为 Exists 或 NotExists,否则至少需要提供一个值。

## 模式

HeaderMatchMode 指定了应如何将这些值与请求标头进行匹配。默认值为 ExactHeader。

ExactHeader——具有给定名称的任意标头必须完整匹配,是否区分大小写取决于 IsCaseSensitive 的值。如果某个标头包含多个值(以 , 或 ; 分隔),会先将其拆分后再进行匹配。匹配前还会去除值两端的一对引号(如果存在)。HeaderPrefix——具有给定名称的任意标头必须按前缀匹配,是否区分大小写取决于 IsCaseSensitive 的值。如果某个标头包含多个值(以 , 或 ; 分隔),会先将其拆分后再进行匹配。匹配前还会去除值两端的一对引号(如果存在)。Exists——该标头必须存在且包含任意非空值。如果存在多个同名标头,该规则同样会匹配。

Contains——具有给定名称的任意标头必须包含任意一个匹配值,是否区分大小写取决于 IsCaseSensitive 的值。

NotContains——具有给定名称的所有标头都不得包含任何一个匹配值,是否区分大小写取决于 IsCaseSensitive 的值。

## IsCaseSensitive

指示值匹配是否区分大小写。默认值为 false,即不区分大小写。

## 示例

以下示例均使用上文指定的配置。

## 场景 1 - 精确标头匹配

带有以下标头的请求将匹配 route1。

Header1: Value1

如果一个标头包含多个值,每个值都会单独进行匹配。以下请求将会匹配。

Header1: Value1, Value2

如果多个值分散在多个同名标头中,同样成立。

Header1: Value1 Header1: Value2

匹配之前,可能会去除值两端的一对引号。以下请求将会匹配。

Header1: "Value1"

多层引号不会被去除,因此不会匹配。

Header1: ""Value1""

## 场景 2 - 多个值

route2 为要在标头中查找的值定义了多个候选值("1prefix"、"2prefix"),其中任意一个都可以接受。它还将 Mode 指定为 HeaderPrefix,因此任何以这些值开头的标头都可以接受。以下任意一个标头都会匹配 route2。

Header2: 1prefix

Header2: 2prefix

Header2: 1prefix-extra

Header2: 2prefix-extra

如果一个标头包含多个值,每个值都会单独进行匹配。以下请求将会匹配。

Header2: foo, 1prefix, 2prefix

如果多个值分散在多个同名标头中,同样成立。

Header2: 1prefix Header2: 2prefix

匹配之前,可能会去除值两端的一对引号。以下请求将会匹配。

Header2: "2prefix"

多层引号不会被去除,因此不会匹配。

Header2: ""2prefix""

## 场景 3 - Exists

route3 只要求标头 "Header3" 存在且包含任意非空值。以下是一个会匹配 route3 的示例。

Header3: value

空标头不会匹配。

Header3:

由于该模式并不检查标头的具体内容,因此它确实支持包含多个值的标头,以及多个同名标头。以下情况都会匹配。

Header3: value1, value2

Header3: value1 Header3: value2

Header3: Header3:

## 场景 4 - 多个标头

route4 要求 header4 和 header5 同时存在,并分别按照各自指定的 Mode 进行匹配。以下标头组合将匹配 route4:

Header4: value1 Header5: AnyValue

Header4: value2 Header5: AnyValue

以下标头组合不会匹配 route4,因为它们缺少其中一个必需的标头:

Header4: value2

Header5: AnyValue

## 场景 5 - NotExists

route7 要求标头 "Header7" 必须不存在。以下标头将匹配 route7:

NotHeader7: AnyValue

以下标头不会匹配 route7,因为标头 "Header7" 存在。

Header7: AnyValue

Header7: 注意:本文作者在 AI 的协助下创作本文。了解详情
