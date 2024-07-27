---

title:      "Spring Boot相关注解"
date:       2021-09-01
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Boot
---

>本文介绍Spring Boot开发web相关注解知识

##### 基础web注解

**Bean处理**

- @Component：通用的注解，可标注任意类为 Spring 组件。如果一个 Bean 不知道属于哪个层，可以使用@Component 注解标注；
- @Repository：对应持久层即 Dao 层，主要用于数据库相关操作；
- @Service：对应服务层，主要涉及一些复杂的逻辑，需要用到 Dao 层；
- @Controller：对应 Spring MVC 控制层，一般需要注入 Service 类返回结果数据；
- @RestController：继承于 @Controller，区别在于标注后整个类所有方法将直接返回 JSON 数据，不再需要视图解析处理，目前前后端分离的项目后端都是直接用这个注解的；
- @Configuration：标注是 Java 代码的配置类， Spring Boot 中推荐这种做法不再使用 xml 配置了；
- @Scope：声明 Spring Bean 的作用域,作用于一共有以下几种：
  - singleton：唯一 bean 实例，Spring 中的 bean 默认都是单例的。
  - prototype：每次请求都会创建一个新的 bean 实例。
  - request：每一次 HTTP 请求都会产生一个新的 bean，该 bean 仅在当前 HTTP request 内有效。
  - session：每一次 HTTP 请求都会产生一个新的 bean，该 bean 仅在当前 HTTP session 内有效。

**HTTP请求**

- @RequestMapping：@RequestMapping(value="/test",method=RequestMethod.GET)可以指定路径和请求方法
- @GetMapping：get请求注解
- @PostMapping：post请求注解
- @PutMapping
- @DeleteMapping

**前后端参数传递**

- @RequestParam：用在方法的参数前面，获取请求中表单类型的key=value格式的数据。
- @PathVariable：用于获取请求路径中的参数。
- @RequestBody：获取请求 body 中的数据，常用于搭配 @PostMapping 请求来提交对象数据.  请求体 的Content-Type 必须为 application/json 格式的数据，接收到数据之后会自动将数据绑定到 Java 对象上去。系统会使用 HttpMessageConverter 或者自定义的 HttpMessageConverter将请求的 body 中的 json 字符串转换为 java 对象。
- @ResponseBody：表示该方法的返回结果直接写入 HTTP response body 中，格式为 json。上面我们提到的 @RestController 其实就是 @Controller 和 @ResponseBody 两个结合起来的。

**读取配置**

- @value：可以在任意 Spring 管理的 Bean 中通过这个注解获取任何来源配置的属性值。
- @ConfigurationProperties：指定该类是配置类，且可以指定配置前缀
- @PropertySource：定读取我们自定义的配置文件的。

```java
    @Component
    @ConfigurationProperties(prefix= "my" )
    @PropertySource(value = {"classpath:my.properties"})
    @Data
    public class MyProperties {
        private int maxValue= 0;
    }
```

**参数校验**

- @NotEmpty 被注释的字符串的不能为 null 也不能为空
- @NotBlank 被注释的字符串非 null，并且必须包含一个非空白字符
- @Null 被注释的元素必须为 null
- @NotNull 被注释的元素必须不为 null
- @AssertTrue 被注释的元素必须为 true
- @AssertFalse 被注释的元素必须为 false
- @Pattern(regex=,flag=)被注释的元素必须符合指定的正则表达式
- @Email 被注释的元素必须是 Email 格式。
- @Min(value)被注释的元素必须是一个数字，其值必须大于等于指定的最小值
- @Max(value)被注释的元素必须是一个数字，其值必须小于等于指定的最大值
- @DecimalMin(value)被注释的元素必须是一个数字，其值必须大于等于指定的最小值
- @DecimalMax(value) 被注释的元素必须是一个数字，其值必须小于等于指定的最大值
- @Size(max=, min=)被注释的元素的大小必须在指定的范围内
- @Digits (integer, fraction)被注释的元素必须是一个数字，其值必须在可接受的范围内
- @Past被注释的元素必须是一个过去的日期
- @Future 被注释的元素必须是一个将来的日期

只需要在请求处理方法中需要验证的参数前加上 @Valid 注解就会开启校验了，如果验证失败将抛出异常：MethodArgumentNotValidException。

- @Validated：如果你的入参不是用一个 Java 对象来接收的话，比如用 @PathVariables 和 @RequestParam 注解来获取入参，这种情况下要校验参数不要忘记在类的头上加 @Validated 注解，这个参数可以告诉 Spring 去校验方法参数。

```java
    @RestController
    @RequestMapping("/user")
    @Validated
    public class UserController {
    @GetMapping("/{id}")
        public ResponseEntity<List<User>> findById( @PathVariable @Max(value = 5,message = "超过 id 的范围了") long id) {
            return new ResponseEntity(userService.findById(id),HttpStatus.OK);
        }
    }
```

**统一异常处理**

- @ControllerAdvice：定义全局异常处理类，包含 @Component 所以可以被 Spring 扫描到。
- @ExceptionHandler : 声明异常处理方法，表示遇到这个异常，就执行标注的方法。


**配置启动**
- @SpringBootApplication：等价于使用 @Configuration、@EnableAutoConfiguration、@ComponentScan  三个注解。
- @Configuration：声明是是一个 Java 形式的配置类，Spring Boot 提倡基于 Java 的配置，相当于你之前在 xml 中配置 bean；
- @EnableConfigurationProperties： 指定配置类，并使配置类生效
- @ComponentScan：标注哪些路径下的类需要被Spring扫描。
- @Conditional：Spring4 新提供的注解，通过 @Conditional 注解可以根据代码中设置的条件装载不同的 bean，也是SpringBoot实现自动配置的基石。