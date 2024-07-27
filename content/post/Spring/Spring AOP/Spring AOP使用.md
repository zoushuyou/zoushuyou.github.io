---

title:      "Spring AOP的初步使用"
date:       2021-01-11
author: "shuyou"
categories: ["Code"]
tags:
    - Spring
---

>"初步了解和使用SPRING AOP"
>
## 一、JDK 动态代理的使用
### 1.Food  目标接口

```java
package proxy;

/**
 * @author zsy
 * @version v1.0
 * @Description
 * @date 2020-09-23 15:50
 */
public interface Food {
    /**
     * @Author Zousy
     * @Description 测试静态代理
     * @Date 15:52 2020/9/23
     * @Param []
     * @return void
     */
    void priName();
}
```
### 2.DynamicProxy 动态代理类 要实现 InvocationHandler接口

```java
package proxy;



import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

/**
 * @author zsy
 * @version v1.0
 * @Description
 * @date 2020-09-23 15:57
 */
public class DynamicProxy implements InvocationHandler {
    private Object target;

    public DynamicProxy(Object target){
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    
            System.out.println("动态代理前------------");
            Object result = method.invoke(target,args);
            System.out.println("动态代理后------------");

            return result;
    }
}

```
### 3.Test 测试类

```java
package proxy;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-01-09 16:32
 */
public class App {
    public static void main(String[] args) {
        Food food = new Food() {
            @Override
            public void priName() {
                System.out.println("--------执行记录---------");
            }
        };
        InvocationHandler invocationHandler = new DynamicProxy(food);

        Food proxy = (Food) Proxy.newProxyInstance(food.getClass().getClassLoader(),
                food.getClass().getInterfaces(),invocationHandler);
        proxy.priName();
    }
}
```
### 4.输出
![执行结果](https://img-blog.csdnimg.cn/2021010916520088.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)


## 二、CGLIB的使用
### 1.Food 目标类

```java
package com.proxy;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-01-09 17:14
 */
public class Food {
    public void priName(){
        System.out.println("----------执行-----------");
    }
}

```
### 1.App 测试类

```java
package com.proxy;

import org.springframework.cglib.proxy.Enhancer;
import org.springframework.cglib.proxy.MethodInterceptor;
import org.springframework.cglib.proxy.MethodProxy;

import java.lang.reflect.Method;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-01-09 17:15
 */
public class App {
    public static void main(String[] args) {
        Enhancer enhancer = new Enhancer();
        Food food = new Food();

        enhancer.setSuperclass(food.getClass());
        enhancer.setCallback(new MethodInterceptor() {
            @Override
            public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
                System.out.println("记录执行日志");
                return methodProxy.invokeSuper(o,objects);
            }
        });

        Food proxy = (Food) enhancer.create();
        proxy.priName();
    }
}

```
### 3. 输出
![输出结果](https://img-blog.csdnimg.cn/2021010917234980.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
## 3. Spring Aop的使用
![spring aop通知类型](https://img-blog.csdnimg.cn/20210114142914482.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
### 1.LogAop 切面类

```java
package com.page.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

/**
 * @author zousy
 * @version v1.0
 * @Description  切面必须配置到IOC容器中
 * @date 2021-01-11 14:06
 */
@Aspect
@Slf4j
@Component
public class LogAop {

    //切入点 需要写 切点表达式
    @Pointcut("execution (* com.page.service.impl.UserServiceImpl.query(..))")
    public void pointcut(){
    }

    @Before("pointcut()")
    public void before(){
        log.info("---------执行之前----------");
    }

    @After("pointcut()")
    public void after(){
        log.info("---------执行之后----------");
    }


    @Around("pointcut()")
    public void around(ProceedingJoinPoint point) throws Throwable {
        log.info("---------环绕执行之前----------");
        point.proceed();
        System.out.println(point.getClass().getName());
        System.out.println(point.getTarget().getClass().getSimpleName());
        log.info("---------环绕执行之后----------");
    }

    @AfterReturning("pointcut()")
    public void afterReturning(){
        log.info("---------------方法返回之后执行--------------");
    }
}

```
### 2.UserServiceImpl 测试类

```java
package com.page.service.impl;

import com.page.service.UserService;
import org.springframework.stereotype.Service;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-01-09 18:02
 */
@Service
public class UserServiceImpl implements UserService {

    public void query(){
        System.out.println("查询用户值");
    }
}

```
### 3.主类

```java
package com.page;

import com.page.service.impl.UserServiceImpl;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.stereotype.Repository;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2020-12-09 17:27
 */
@SpringBootApplication
@MapperScan(
        basePackages = "com.zsy.page.*",
        annotationClass = Repository.class)
//开启Spring AOP功能
@EnableAspectJAutoProxy
public class AopPageApplication {
    public static void main(String[] args) {
        //SpringApplication.run(AopPageApplication.class,args);
        ConfigurableApplicationContext context = SpringApplication.run(AopPageApplication.class, args);
        UserServiceImpl bean = context.getBean(UserServiceImpl.class);
        bean.query();
    }
}

```
### 4.结果
![结果](https://img-blog.csdnimg.cn/20210114145820167.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
