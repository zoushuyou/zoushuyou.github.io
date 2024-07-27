---

title:      "Spring AOP的初步了解"
date:       2021-01-09
author: "shuyou"
categories: ["Code"]
tags:
    - Spring
---
>"初步了解和使用SPRING AOP"

##  一、AOP

### 1.1 什么是AOP

AOP(Aspect Orient Programming)，面向切面编程。AOP是一种编程思想，是对面向对象编程（OOP）的一种补充。


### 1.2 AOP实现分类
AOP的本质是由AOP框架修改业务组件的字节码，是代理模式的一种应用。按照修改的字节码的时机可以分为两类:
* 静态AOP: AOP框架在编译阶段进行修改，生成了静态的AOP代理类(生成的.class文件已经被改动)，比如AspecJ框架。
* 动态AOP: AOP框架在运行阶段动态生成代理对象(在内存中动态生成程序需要的.class文件)，比如SpringAop。

**常用AOP实现比较**

![aop.png](https://img-blog.csdnimg.cn/20210109151326747.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70#pic_center)

## 二、AOP术语
* Aspect（切面）：通常是一个类，里面定义切入点和通知。
* JointPoint（连接点）：程序执行过程中可以插入的点，可以是方法的调用、异常的抛出，在Spring AOP中通常是方法的调用。
* Advice（通知）：AOP框架中的增强处理，有before,after,afterReturning,afterThrowing,around
* PoinCut（切入点）：带有通知的连接点，
* 引入（Introduction）：引入允许我们向现有的类添加新的方法或者属性。
* 织入（Weaving）: 将增强处理添加到目标对象中，并创建一个被增强的对象，这个过程就是织入。

## 三、初步认识Spring AOP
Spring AOP 与ApectJ 的目的一致，都是为了统一处理横切业务，但与AspectJ不同的是，Spring AOP 并不尝试提供完整的AOP功能(即使它完全可以实现)，Spring AOP 更注重的是与Spring IOC容器的结合，并结合该优势来解决横切业务的问题，因此在AOP的功能完善方面，相对来说AspectJ具有更大的优势，同时,Spring注意到AspectJ在AOP的实现方式上依赖于特殊编译器(ajc编译器)，因此Spring很机智回避了这点，转向采用动态代理技术的实现原理来构建Spring AOP的内部机制（动态织入），这是与AspectJ（静态织入）最根本的区别。在AspectJ 1.5后，引入@Aspect形式的注解风格的开发，Spring也非常快地跟进了这种方式，因此Spring 2.0后便使用了与AspectJ一样的注解。请注意，Spring 只是使用了与 AspectJ 5 一样的注解，但仍然没有使用 AspectJ 的编译器，底层依是动态代理技术的实现，因此并不依赖于 AspectJ 的编译器。