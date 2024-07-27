---

title:      "OpenFeign服务调用"
date:       2021-10-18
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Cloud
---

>本文介绍 OpenFeign 相关知识

# 简介

Spring Cloud OpenFeign 是声明式的服务调用工具，它整合了Ribbon和Hystrix，拥有负载均衡和服务容错功能。

# 依赖

```xml

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
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
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-loadbalancer</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
        </dependency>
    </dependencies>

```
这里使用 nacos 做服务注册中心，要想拥有负载均衡和服务容错还须引入 loadbalancer 和 hystrix 依赖包。

# 配置

```yaml

server:
  port: 8445

spring:
  application:
    name: feign
  cloud:
    nacos:
      discovery:
        server-addr: http://10.60.80.115:8848

feign:
  circuitbreaker:
    enabled: true   //开启服务容错功能 这里由于使用的版本较高  低版本应该是 feign.hystrix.enabled
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 5000
        loggerLevel: FULL   //请求的日志级别为记录全部

logging:
  level:
    com.zsy.feign: debug    //还需指定本项目的日志级别

```

需要在启动类上加上注解 @EnableFeignClients

# 使用

创建一个接口，并加上注解 @FeignClient，例如： @FeignClient(value = "provider",  fallback = FallBackService.class)

这里的 value 表示要调用的服务的名称， fallback 表示服务降级时调用的类。

[参考代码](https://github.com/ZouShuYou/spring-cloud-samples/tree/main/spring-cloud-openfeign)
