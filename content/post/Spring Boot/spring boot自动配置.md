---

title:      "Spring Boot自动配置相关知识"
date:       2021-08-31
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Boot
---

>本文介绍Spring Boot自动配置相关知识

Spring 3.0开始，Spring提供了Java Config的方式，进行Spring bean的创建

```java
@Configuration
public class DemoConfiguration {

    @Bean
    public void object() {
        return new Obejct();
    }
}
```

-   通过在类上添加 @Configuration 注解，声明这是一个 Spring 配置类。
-   通过在方法上添加 @Bean 注解，声明该方法创建一个 Spring Bean。

在Spring Boot中也可以使用上述注解进行Bean的配置。
- 配置类：在类上添加了 @Configuration 注解，声明这是一个配置类
- 条件注解：在类上添加了 @ConditionalOnWebApplication 条件注解
- 配置属性：使用@ConfigurationProperties 注解声明配置属性类和 @EnableConfigurationProperties 注解让配置属性类生效

**自动配置**
上面的介绍仅仅是解决了配置的问题，Spring Boot是如何实现自动配置的呢？

@SpringBootApplication 注解中有 @EnableAutoConfiguration 这样一个注解。而@EnableAutoConfiguration 这个注解看名字就知道是启用自动配置注解

**@EnableAutoConfiguration**

@EnableAutoConfiguration使用@Import添加了一个AutoConfigurationImportSelector类，Spring自动注入配置的核心功能就依赖于这个对象。

在这个类中，提供了一个getCandidateConfigurations()方法用来加载配置文件。借助Spring提供的工具类SpringFactories的loadFactoryNames()方法加载配置文件。扫描的默认路径位于META-INF/spring.factories中。

![路径](https://img-blog.csdnimg.cn/fe0b7e93b6f8456f9ad82229766fd2b5.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP6Iiffg==,size_20,color_FFFFFF,t_70,g_se,x_16)
原先 @Configuration 注解的配置类，就升级成类自动配置类。这样，Spring Boot 在获取到需要自动配置的配置类后，就可以自动创建相应的 Bean，完成自动配置的功能。

**AutoConfigurationImportSelector类中的getAutoConfigurationEntry()方法**
![调用](https://img-blog.csdnimg.cn/c09e11c57e284300b8455b44ca0d5c5a.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP6Iiffg==,size_20,color_FFFFFF,t_70,g_se,x_16)
ConfigurationClassPostProcessor类实现了BeanDefinitionRegistryPostProcessor接口。
而在Spring刷新容器时，会实例化BeanDefinitionRegistryPostProcessor接口的实现类，并调用它的postProcessBeanDefinitionRegistry方法![在这里插入图片描述](https://img-blog.csdnimg.cn/aaecee23da974280bcb19eea091121f1.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP6Iiffg==,size_20,color_FFFFFF,t_70,g_se,x_16)
ConfigurationClassPostProcessor类的postProcessBeanDefinitionRegistry调用了ConfigurationClassParser类的getImports方法，该方法会调用AutoConfigurationImportSelector的process方法进行自动配置类的导入和过滤。
![在这里插入图片描述](https://img-blog.csdnimg.cn/95f64ef39d724bae9d44fd3fb162aa7d.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP6Iiffg==,size_20,color_FFFFFF,t_70,g_se,x_16)
![在这里插入图片描述](https://img-blog.csdnimg.cn/56cf8eb4a7a44b03ba4035307b4d3269.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP6Iiffg==,size_20,color_FFFFFF,t_70,g_se,x_16)
ConfigurationClassParser类起到解析配置类的作用
ConfigurationClassPostProcessor类中会将解析的配置类注入到Spring IOC容器
![在这里插入图片描述](https://img-blog.csdnimg.cn/f55d8a3dcc0d4331a675e154a5e2c5b8.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP6Iiffg==,size_20,color_FFFFFF,t_70,g_se,x_16)
