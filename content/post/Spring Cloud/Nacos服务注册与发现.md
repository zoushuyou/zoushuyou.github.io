---

title:      "Nacos服务注册与发现"
date:       2021-10-13
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Cloud
---

>本文介绍 Nacos 相关知识

# 简介
Nacos 可以用来实现分布式环境下的配置管理和服务注册与发现。

-	通过 Nacos Server 和 spring-cloud-starter-alibaba-nacos-config 实现配置的动态变更。
-	通过 Nacos Server 和 spring-cloud-starter-alibaba-nacos-discovery 实现服务的注册与发现。

# 安装
Nacos下载地址：[nacos](https://github.com/alibaba/nacos/releases)

下载并解压之后，还需要作一些配置

conf 目录下的 application.properties 需要配置数据源

```xml
### If use MySQL as datasource:
 spring.datasource.platform=mysql

### Count of DB:
 db.num=1

### Connect URL of DB:
 db.url.0=jdbc:mysql://127.0.0.1:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
 db.user.0=root
 db.password.0=123456
```
然后在MySQL数据库中新建nacos数据库，并导入Nacos解压包conf目录下的nacos-mysql.sql脚本

更改 Nacos 启动方式为单机模式
![naocs启动方式](https://img-blog.csdnimg.cn/5ded6c02ed71487abcc1f9a18a5c9320.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP6Iiffg==,size_20,color_FFFFFF,t_70,g_se,x_16)
# 配置
pom.xml文件

需要注意的是 spring-cloud-starter-alibaba-nacos-discovery 的依赖，我看网上其他例子配的是spring-cloud-alibaba-nacos-discovery，这个好像是低版本的依赖

```xml
	<properties>
		<java.version>1.8</java.version>

		<!-- 核心依赖 -->
		<spring-boot.version>2.4.3</spring-boot.version>
		<spring-cloud.version>2020.0.2</spring-cloud.version>
		<spring-cloud-alibaba.version>2021.1</spring-cloud-alibaba.version>
	</properties>

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
	</dependencies>

	<dependencyManagement>
		<dependencies>
			<!-- 核心依赖 -->
			<!--spring boot-->
			<dependency>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-dependencies</artifactId>
				<version>${spring-boot.version}</version>
				<type>pom</type>
				<scope>import</scope>
			</dependency>
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
		</dependencies>
	</dependencyManagement>
```

启动类上需要加注解 `@EnableDiscoveryClient`

application.yml 中需要指明 nacos 的地址

```yaml
server:
  port: 8443

spring:
  application:
    name: provider

  cloud:
    nacos:
      discovery:
        server-addr: http://10.60.80.115:8848

```

# 入门代码案例
[参考：spring-cloud-samples](https://github.com/ZouShuYou/spring-cloud-samples/tree/main/spring-cloud-alibaba-nacos-register)



