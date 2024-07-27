---
title:      "Spring 循环依赖"
date:       2021-12-28
author: "shuyou"
categories: ["Code"]
tags:
    - Spring
---

> 本文介绍Spring的循环依赖问题，以及Spring是如何解决的。

循环依赖是指多个对象实例之间存在直接或间接的依赖关系，如A对象中引用了B对象，B对象中引用了A对象，有时在项目中遇到这种情况会出现StackOverflow异常，可以通过属性注入的方式解决这个问题。

Spring循环依赖是指容器中的bean对象存在的循环依赖问题，Spring通过使用三级缓存解决的该问题。

-   第一层缓存（singletonObjects）：单例对象缓存池，已经实例化并且属性赋值，这里的对象是成熟对象；
-   第二层缓存（earlySingletonObjects）：单例对象缓存池，已经实例化还未属性赋值，这里的对象是半成品对象；
-   第三层缓存（singletonFactories）: 单例工厂的缓存


AbstractBeanFactory类中：

```java

/** Cache of singleton objects: bean name --> bean instance */
private final Map<String, Object> singletonObjects = new ConcurrentHashMap<String, Object>(256);
 
/** Cache of early singleton objects: bean name --> bean instance */
private final Map<String, Object> earlySingletonObjects = new HashMap<String, Object>(16);

/** Cache of singleton factories: bean name --> ObjectFactory */
private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<String, ObjectFactory<?>>(16);

```

获取单例bean

```java

    protected Object getSingleton(String beanName, boolean allowEarlyReference) {
        //从一级缓存中获取
        Object singletonObject = this.singletonObjects.get(beanName);
        if (singletonObject == null && this.isSingletonCurrentlyInCreation(beanName)) {
            synchronized(this.singletonObjects) {
                //一级缓存获取不到，则从二级缓存中获取
                singletonObject = this.earlySingletonObjects.get(beanName);
                if (singletonObject == null && allowEarlyReference) {
                    //从三级缓存中获取 ObjectFactory
                    ObjectFactory<?> singletonFactory = (ObjectFactory)this.singletonFactories.get(beanName);
                    if (singletonFactory != null) {
                        singletonObject = singletonFactory.getObject();
                        //将beanName存入二级缓存
                        this.earlySingletonObjects.put(beanName, singletonObject);
                        // 把当前这个 beanName 从三级缓存中删除
                        this.singletonFactories.remove(beanName);
                    }
                }
            }
        }

        return singletonObject != NULL_OBJECT ? singletonObject : null;
    }

```

bean的获取过程：先从一级缓存获取，获取不到再从二级缓存获取，获取不到再从三级缓存获取并提高到二级缓存中

检测循环依赖的过程：

1. A创建过程中需要B，于是A将自己放入三级缓存，再实例化B
2. B实例化时发现需要A，于是 B 先查一级缓存，没有，再查二级缓存，还是没有，再查三级缓存，找到了！
   -    然后把三级缓存里面的这个 A 放到二级缓存里面，并删除三级缓存里面的 A
   -    B 顺利初始化完毕，将自己放到一级缓存里面（此时 B 里面的 A 依然是创建中状态）
3. 然后回来接着创建 A，此时 B 已经创建结束，直接从一级缓存里面拿到 B ，然后完成创建，并将自己放到一级缓存里面

# 相关问题

**Spring为什么不能解决构造器的循环依赖？**

构造器注入形成的循环依赖： 也就是beanB需要在beanA的构造函数中完成初始化，beanA也需要在beanB的构造函数中完成舒适化，这种情况的结果就是两个bean都不能完成初始化，循环依赖难以解决。

Spring解决循环依赖主要依赖三级缓存，但在调用构造方法之前也就是实例化之前还未将其放入三级缓存，因此后续依赖调用构造方法的时候并不能从三级缓存中获取到依赖的Bean。

**Spring为什么不能解决prototype作用域循环依赖？**

这种循环依赖同样无法解决，因为spring不会缓存‘prototype’作用域的bean，而spring中循环依赖的解决正是通过缓存来实现的。

**Spring为什么不能解决多例的循环依赖？**

多实例Bean是每次调用一次getBean都会执行一次构造方法并且未属性赋值，根本没有三级缓存，因此无法解决循环依赖。


**参考**

 1. [Spring 循环依赖问题（三级缓存）](https://alsritter.icu/posts/c36d7d61/)
 2. [Spring进阶- Spring IOC实现原理详解之Bean实例化(生命周期,循环依赖等)](https://pdai.tech/md/spring/spring-x-framework-ioc-source-3.html)
