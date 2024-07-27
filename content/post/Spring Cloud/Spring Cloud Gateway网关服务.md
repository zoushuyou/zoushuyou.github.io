---

title:      "Spring Cloud Gateway网关服务"
date:       2021-10-27
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Cloud
---

>本文介绍Spring Cloud Gateway网关服务相关知识

# 简介
Gateway 是Spring提供的API网关服务框架，具有强大的智能路由和过滤功能。

# 依赖

```xml
    <properties>
        <java.version>1.8</java.version>

        <!-- 核心依赖 -->
        <spring-cloud.version>2020.0.2</spring-cloud.version>
        <spring-cloud-alibaba.version>2021.1</spring-cloud-alibaba.version>
        <nacos.version>2.0.1</nacos.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-bootstrap</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-loadbalancer</artifactId>
        </dependency>
    </dependencies>

    <dependencyManagement>
        <dependencies>
            <!-- 核心依赖 -->

            <!--spring cloud-->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!--spring cloud alibaba-->
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring-cloud-alibaba.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-starter-gateway</artifactId>
                <version>3.0.2</version>
            </dependency>

            <dependency>
                <groupId>com.alibaba.nacos</groupId>
                <artifactId>nacos-client</artifactId>
                <version>${nacos.version}</version>
                <exclusions>
                    <exclusion>
                        <groupId>org.yaml</groupId>
                        <artifactId>snakeyaml</artifactId>
                    </exclusion>
                </exclusions>
            </dependency>
        </dependencies>
    </dependencyManagement>

```
这里使用 nacos 做服务注册中心，还须引入 loadbalancer 和 gateway 依赖包。

# 配置

```yaml

server:
  port: 8446

spring:
  application:
    name: gateway
  cloud:
    nacos:
      discovery:
        server-addr: http://10.60.80.115:8848

    gateway:
      discovery:
        locator:    
          enabled: true     #开启从注册中心动态创建路由的功能
      routes:
        - id: feign
          uri: lb://feign   #lb是指从注册中心获取id为feign的路由地址
          predicates:
            - Path=/**
            - Method=GET
logging:
  level:
    com.zsy.gateway: debug

```

# 使用

[参考代码](https://github.com/ZouShuYou/spring-cloud-samples/tree/main/spring-cloud-gateway)

# 一些配置功能

## Route Predicate
Spring Cloud Gateway包括许多内置的Route Predicate工厂。 所有这些Predicate都与HTTP请求的不同属性匹配。 多个Route Predicate工厂可以进行组合。可以参考[官网](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#gateway-request-predicates-factories)，这里只列举一些，比如：
-   After Route Predicate       在指定时间之后的请求会匹配该路由
-   Before Route Predicate      在指定时间之前的请求会匹配该路由

## Route Filter

路由过滤器可用于修改进入的HTTP请求和返回的HTTP响应，路由过滤器只能指定路由进行使用。Spring Cloud Gateway 内置了多种路由过滤器，他们都由GatewayFilter的工厂类来产生。可以参考[官网](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#gatewayfilter-factories)，这里只列举一些，比如：
-   AddRequestHeader        给请求头添加参数的过滤器
-   AddRequestParameter     给请求添加参数的过滤器

# How It Works

![工作原理图](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/images/spring_cloud_gateway_diagram.png)
