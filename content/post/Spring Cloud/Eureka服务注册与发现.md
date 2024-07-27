---

title:      "Eureka服务注册与发现"
date:       2021-10-11
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Cloud
---

>本文介绍Eureka相关知识

# 简介
Eureka是由netflix开发的一款服务治理的框架，Sping Cloud对其进行了集成。

Eureka既包括客户端也包括服务端。Eureka客户端是服务提供者，它将自己注册到Eureka服务端，并周期性地发送心跳包来更新它的服务租约，同时也能从服务端查询当前注册的服务信息并把它们缓存到本地并周期性地刷新服务状态；Eureka服务端是一个服务注册中心，提供服务的注册和发现，即当前有哪些服务注册进来可供使用。

![Eureka架构](https://img-blog.csdnimg.cn/9134b450a8d94833b3b7972c82a50eff.png?,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP6Iiffg==,size_20,color_FFFFFF,t_70,g_se,x_16)
## 服务注册中心
1.在pom.xml文件中引入 eureka-server

```java
        <!--eureka-server-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
```
2.在启动类中加上注解 **@EnableEurekaServer**
3.在 application.yml 添加以下配置，作为服务注册中心时禁止默认的自我注册：

```yaml
eureka:
  instance:
    hostname: eureka7001.com #eureka服务端实例名称
  client:
    register-with-eureka: false #表示不向注册中心注册自己
    fetch-registry: false #false表示自己就是注册中心
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka/
```
## 服务提供者
1.在pom.xml文件中引入 eureka-client

```java
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
```
2.在启动类中加上注解 **@EnableDiscoveryClient**
3.在 application.yml 添加以下配置：

```yaml
eureka:
  client:
    register-with-eureka: true #表示向注册中心注册自己
    fetch-registry: true #是否从EurekaServer抓取已有的注册信息，默认为true，单节点无所谓,集群必须设置为true才能配合ribbon使用负载均衡
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka/,http://eureka7002.com:7002/eureka/
```
## Eureka-Server集群
Eureka服务端充当了重要的角色，所有Eureka客户端都将自己提供的服务注册到Eureka服务端，然后供所有服务消费者使用。如果单节点的Eureka服务端宕机了，那么所有服务都无法正常的访问，这必将是灾难性的。为了提高Eureka服务端的可用性，我们一般会对其集群部署，即同时部署多个Eureka服务端，并且可以相互间同步服务。

eureka-server1:

```yaml
server:
  port: 7001

eureka:
  instance:
    hostname: eureka7001.com #eureka服务端实例名称
  client:
    register-with-eureka: false #表示不向注册中心注册自己
    fetch-registry: false #false表示自己就是组测中心
    service-url:
      defaultZone: http://eureka7002.com:7002/eureka/
```
eureka-server2:
```yaml
server:
  port: 7002

eureka:
  instance:
    hostname: eureka7001.com #eureka服务端实例名称
  client:
    register-with-eureka: false #表示不向注册中心注册自己
    fetch-registry: false #false表示自己就是组测中心
    service-url:
      defaultZone: http://eureka7001.com:7001/eureka/
```
通过指定 defaultZone 为其他 server 地址进行集群。


**参考**

 1. [Spring Cloud Eureka服务治理](https://mrbird.cc/Spring-Cloud-Eureka.html)
 2. [Eureka](http://cloud.spring.io/spring-cloud-netflix/1.4.x/multi/multi__service_discovery_eureka_clients.html)




