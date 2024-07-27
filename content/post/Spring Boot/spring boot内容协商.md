---

title:      "Spring Boot内容协商"
date:       2021-09-13
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Boot
---

>本文介绍内容协商相关知识

##### 内容协商（Content Negotiation）

**内容协商**：客户端和服务器就响应的资源内容进行交涉，然后服务器提供给客户端最为合适的资源。

内容协商会以响应资源的语言、字符集、编码方式等作为判断的基准。HTTP请求头中Content-Type，Accept等内容就是内容协商判断的标准。

##### HttpMessageConverter
HttpMessageConverter为HTTP消息转换接口，Spring Boot根据不同的媒体类型进行了相应的实现。


-   MappingJackson2XmlHttpMessageConverter
-   MappingJackson2HttpMessageConverter

当使用`@ResponseBody`注解时，默认是返回JSON格式的数据。

当在`pom.xml`中加入如下两个包：
```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.9.8</version>
</dependency>
<!-- jackson默认只会支持的json。若要xml的支持，需要额外导入如下包 -->
<dependency>
    <groupId>com.fasterxml.jackson.dataformat</groupId>
    <artifactId>jackson-dataformat-xml</artifactId>
    <version>2.9.8</version>
</dependency>
```
指定请求头`Accpt: application/xml`时，就会返回XML格式的数据。

这是因为最终都由`AbstractMessageConverterMethodProcessor.writeWithMessageConverters()`处理

Spring Boot会根据请求头进行内容协商，返回相应格式的数据。

通过实现AbstractGenericHttpMessageConverter类，可以自定义HttpMessageConverter。

除了请求头`Accept`，还可以根据扩展名、请求参数等方法进行内容协商。


除了HttpMessageConverter外，还能通过实现HandlerMethodArgumentResolver接口对方法入参进行内容协商。
通过实现HandlerMethodReturnValueHandler接口对返回值进行内容协商。

值得注意的是：不能在配置类WebMvcConfigurer中通过重写addArgumentResolvers的方式来添加到Spring Boot自带的HandlerMethodArgumentResolver实现类集合，而是通过修改RequestMappingHandlerAdapter来实现。


**参考**：

 1. [自定义Spring Boot 内容协商](https://mrbird.cc/Spring-Boot-Diy-Resolver.html)
 2. [Spring MVC内容协商](https://cloud.tencent.com/developer/article/1497764)
