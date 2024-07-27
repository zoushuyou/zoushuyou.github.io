---

title:      "Spring bean的生命周期相关知识"
date:       2021-03-30
author: "shuyou"
categories: ["Code"]
tags:
    - Spring
---

>本文简单介绍Spring bean的生命周期相关知识

### Spring IOC 简介
**IOC**：Inversion of Control,即控制反转。传统Java程序中，我们是自己创建对象，而Spring IoC 是有一个容器来保管我们创建的对象，即将对象交给Spring 容器进行管理。

**bean**：在 Spring 中，构成应用程序主干并由 Spring IoC 容器管理的对象称为 bean。 bean 是一个由 Spring IoC 容器实例化，组装和管理的对象。

**BeanDefinition**：bean的定义类，用来存储bean的所有属性和方法。

**BeanFactory**：BeanFactory接口是Spring IoC的基础。

**ApplicationContext**：是BeanFactory的子接口，同时还继承了其他的接口，是相对比较高级的 IoC 容器实现。

**bean生命周期核心流程**：

 1. 实例化	Instantiation
 2. 注入属性		Populate
 3. 初始化	Initialization
 4. 销毁	Destruction

**bean生命周期经历了各种方法的调用，可以分为几类**：

 1. Bean自身的方法：这个包括了Bean本身调用的方法和通过配置文件中<bean>的init-method和destroy-method指定的方法
 2. Bean级生命周期接口方法：这个包括了BeanNameAware、BeanFactoryAware、InitializingBean和DiposableBean这些接口的方法
 3. 容器级生命周期接口方法：这个包括了InstantiationAwareBeanPostProcessor 和 BeanPostProcessor 这两个接口实现，一般称它们的实现类为“后置处理器”。


### Spring Bean生命周期
![Spring bean生命周期](https://img-blog.csdnimg.cn/20210330191031791.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70#pic_center)

**测试代码**：[bean生命周期](https://github.com/ZouShuYou/sping-boot-demos/tree/master/spring-bean-lifecycle)


### 扩展点
**4个后置处理器**：

 1. InstantiationAwareBeanPostProcessor
 2. SmartInstantiationAwareBeanPostProcessor
 3. MergedBeanDefinitionPostProcessor
 4. SmartInitializingSingleton

**影响多个Bean**：

- BeanPostProcessor ：
	1. postProcessBeforeInitialization
	2. postProcessAfterInitialization
- InstantiationAwareBeanPostProcessor
	1. postProcessBeforeInstantiation
	2. postProcessAfterInstantiation
	3. postProcessProperties
- MergedBeanDefinitionPostProcessor
	1. postProcessMergedBeanDefinition
- SmartInstantiationAwareBeanPostProcessor
	1. determineCandidateConstructors
	2. getEarlyBeanReference

**影响单个Bean**：

 - BeanNameAware
 - BeanClassLoaderAware
 - BeanFactoryAware
 - EnvironmentAware
 - EmbeddedValueResolverAware
 - ApplicationContextAware
 - InitializingBean
 - DisposableBean

	
**参考**：

 1. [spring bean生命周期](https://blog.csdn.net/qq_23473123/article/details/76610052?utm_medium=distribute.pc_relevant_t0.none-task-blog-BlogCommendFromMachineLearnPai2-1.baidujs&dist_request_id=1328740.50450.16170841210074475&depth_1-utm_source=distribute.pc_relevant_t0.none-task-blog-BlogCommendFromMachineLearnPai2-1.baidujs)
