---
title:      "Mybatis执行过程"
date:       2021-11-16
author: "shuyou"
categories: ["Code"]
tags:
    - Mybatis
---

> 本文简单分析Mybatis的执行过程

## 重要类

1.  SqlSession
2.  Configuration
3.  Excutor
4.  MappedStatement
5.  StatementHandler

## 从注入开始

spring boot使用mybatis，需要导入mybatis-spring-boot-starter包，该包会导入mybatis-spring-boot-autoconfigure包。

MybatisAutoConfiguration类会自动注入 SqlSessionFactory ，注入MapperScannerConfigurer且会扫描dao包，注入其中标注@Mapper注解的接口。
如果是使用XML配置的，则会在 SqlSessionFactory（其实是SqlSessionFactoryBean类） 注入时，扫描xml配置，并添加到 Configuration 中。
会注入 SqlSessionTemplate ，该类包含一个SqlSession代理类。

## MapperRegistry、MapperProxyFactory、MapperProxy

Configuration中包含 MapperRegistry 属性。

mapperRegistry有getMapper和addMapper方法，有一个map，用来保存mapper类和MapperProxyFactory。当需要的mapper在map中找不到时，会通过MapperProxyFactory生成一个代理mapper类。

MapperProxyFactory是MapperProxy的工程类，可以生成MapperProxy代理类

MapperProxy是Mapper代理类，相当于mapper接口的注入到容器的bean类型，使用mapper接口的方法时，会调到MapperProxy的invoke方法上，这里使用的是JDK代理。


## SqlSessionTemplate、SqlSession

MapperProxy的invoke方法会执行MapperMethod的invoke方法，之后根据sql语句类型继续向下执行，接着会调用SqlSessionTemplate上的方法，

SqlSessionTemplate会调用代理的SqlSession类上的方法，这里是DefaultSqlSession。

## Excutor

MappedStatement包含很多属性，sql语句、返回结果等
DefaultSqlSession会调用Excutor继续执行相应的方法。

## StatementHandler

Excutor执行时，会调用相应的StatementHandler继续执行。

## 小结

大致的流程就是上述过程，还是挺复杂的。



**参考**

 1. [SpringBoot中，Mybatis的执行流程源码解析](https://blog.csdn.net/qq_46225886/article/details/113439372)
