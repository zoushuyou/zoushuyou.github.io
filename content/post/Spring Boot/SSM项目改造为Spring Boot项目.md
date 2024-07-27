---

title:      "SSM项目改造为Spring Boot项目"
date:       2021-10-28
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Boot
---

>本文介绍怎么把SSM项目改造为Spring Boot项目

## 0.改造步骤

1.  原ssm项目打成jar包
2.  将相关配置文件放到**resources**目录下
3.  将前端界面文件放到**web**目录下
4.  servlet 、 listener 和 Filter 要注册到容器中


## 1.Servlet
SSM里使用的Servlet，要注册到容器中

使用ServletRegistrationBean类或者使用注解@WebServlet

```java
    @Bean
    public ServletRegistrationBean myServlet() {
        return new ServletRegistrationBean(new MyServlet, new String[]{"/kjdp_cache"});
    }
```

## 2.Filter
SSM里使用的Filter，要注册到容器中

使用FilterRegistrationBean类或者使用注解@WebFilter

```java
    @Bean
    public FilterRegistrationBean encodingFilter() {
        FilterRegistrationBean registration = new FilterRegistrationBean();
        registration.setName("encodingFilter");
        registration.setOrder(1);
        registration.addUrlPatterns(new String[]{"/*"});
        registration.setFilter(new CharacterEncodingFilter());
        registration.addInitParameter("encoding", "UTF-8");
        return registration;
    }
```

## 3.Listener
SSM里使用的Filter，要注册到容器中

使用ListenerRegistrationBean类或者使用注解@WebListener

## 4.自定义启动类注解

可以通过@SpringBootApplication再注解一个自定义启动类注解

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@SpringBootApplication
@ImportResource
public @interface MyBootApplication {
    @AliasFor(
        annotation = ImportResource.class
    )
    String[] locations() default {"classpath:conf/spring-application.xml"};

    @AliasFor(
        annotation = SpringBootApplication.class
    )
    Class<?>[] exclude() default {DataSourceAutoConfiguration.class};

    @AliasFor(
        annotation = SpringBootApplication.class
    )
    String[] excludeName() default {};

    @AliasFor(
        annotation = SpringBootApplication.class
    )
    String[] scanBasePackages() default {"com.my.boot"};

    @AliasFor(
        annotation = SpringBootApplication.class
    )
    Class<?>[] scanBasePackageClasses() default {};

    @AliasFor(
        annotation = SpringBootApplication.class
    )
    boolean proxyBeanMethods() default true;
}
```

使用上面三个注解的需要在启动类上加一个@ServletComponentScan注解来扫描。
