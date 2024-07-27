---
title:      "Java线程池相关知识"
date:       2021-04-01
author: "shuyou"
categories: ["Code"]
tags:
    - Java并发
---
>本文介绍Java线程池相关知识

### 前言
**线程池**：线程池是一种基于池化思想管理线程的工具，经常出现再多线程服务器中。

**线程池解决的问题是什么**：
线程池解决的核心问题就是资源管理问题。在并发环境下，系统不能确定任意时刻，有多少任务需要执行，有多少资源需要投入。会存在下列问题：

 1. 频繁申请/销毁资源和调度资源，将带来额外的消耗，可能会非常巨大。
 2. 对资源无限申请缺乏抑制手段，可能会引发系统资源耗尽的风险。
 3. 系统无法合理管理内部的资源分布，会降低系统的稳定性。

为解决资源分配这个问题，线程池采用了“池化”（Pooling）思想。池化，顾名思义，是为了最大化收益并最小化风险，而将资源统一在一起管理的一种思想。

**线程池的优点**：

 - 降低资源消耗：通过池化技术重复利用已创建的线程，降低线程创建和销毁造成的损耗。
 - 提高响应速度：任务到达时，无需等待线程创建即可立即执行。
 - 提高线程的可管理性：线程是稀缺资源，如果无限制创建，不仅会消耗系统资源，还会因为线程的不合理分布导致资源调度失衡，降低系统的稳定性。使用线程池可以进行统一的分配、调优和监控。
 - 提供更多更强大的功能：线程池具备可拓展性，允许开发人员向其中增加更多的功能。比如延时定时线程池ScheduledThreadPoolExecutor，就允许任务延期执行或定期执行。

### TheadPoolExecutor源码设计
Java中线程池核心实现类是ThreadPoolExecutor,它的继承关系：
![ ThreadPoolExecutor 继承关系](https://img-blog.csdnimg.cn/2021040116000948.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70#pic_center)

**运行机制**：
ThreadPoolExecutor内部实际上构建了一个生产者消费者模型，将线程和任务两者解耦，并不直接关联。线程池的运行主要分为两部分：任务管理、线程管理。任务管理部分充当生产者的角色，当任务提交后，线程池会判断该任务后续的流转：

 1. 直接申请线程执行任务
 2. 缓存到队列中等待线程执行
 3. 拒绝该任务

线程管理部分是消费者，它们被统一维护在线程池内，根据任务请求进行线程的分配，当线程执行完任务后会继续获取新的任务去执行，最终当线程获取不到任务时，线程就会被回收。

![ThreadPoolExecutor运行流程](https://img-blog.csdnimg.cn/img_convert/3d9113e3961a68dc85fe6e15fd52ea70.png#pic_center)

**运行状态**：
ThreadPoolExecutor的运行状态有5种，分别为：

| 运行状态 | 状态描述 |
|---|---|
| RUNNING | 能接受新提交的任务，且也能处理阻塞队列中的任务 |
| SHUTDOWN | 不再接受新提交的任务，但是能处理阻塞队列中的任务 |
| STOP | 不能接受新提交的任务，也不能处理阻塞队列中的任务，会中断正在处理任务的线程 |
| TIDYING | 所有任务都已经终止了，workerCount（有效线程数）为0 |
| TERMINATED | 在terminated()方法执行完后进入该状态 |

其生命周期转换如下入所示：
![线程池生命周期](https://img-blog.csdnimg.cn/img_convert/432693a9f531da06274114af24421f9b.png#pic_center)
**任务调度**：
当使用execute方法提交一个任务到ThreadPoolExecutor时，会检查现在的线程池运行状态、运行线程数、运行策略，决定接下来执行的流程，是直接申请线程执行，或是缓冲到队列中执行，亦或是直接拒绝该任务。其执行过程如下：

 1. 首先检测线程池运行状态，如果不是RUNNING，则直接拒绝，线程池要保证在RUNNING的状态下执行任务。
 2. 如果workerCount < corePoolSize，则创建并启动一个线程来执行新提交的任务。
 3. 如果workerCount >= corePoolSize，则判断任务阻塞队列是否已满，若未蛮则将任务添加到该阻塞队列，若已满则判断工作线程数是否大于最大线程数，如果小于，则创建并启动一个线程来执行新提交的任务，如果大于则根据拒绝策略来处理该任务，默认的处理方式是直接抛异常。

![在这里插入图片描述](https://img-blog.csdnimg.cn/img_convert/c56abc7d2dec4791faccebd708452fd6.png#pic_center)
**任务申请**：
由上文的任务分配部分可知，任务的执行有两种可能：一种是任务直接由新创建的线程执行。另一种是线程从任务队列中获取任务然后执行，执行完任务的空闲线程会再次去从队列中申请任务再去执行。第一种情况仅出现在线程初始创建的时候，第二种是线程获取任务绝大多数的情况。
![任务流程图](https://img-blog.csdnimg.cn/img_convert/11553b961689e8854be6c5745e657ff1.png#pic_center)
**任务拒绝**：
拒绝策略是一个接口：
```java
	public interface RejectedExecutionHandler {
	    void rejectedExecution(Runnable r, ThreadPoolExecutor executor);
	}
```
用户可以通过实现这个接口去定制拒绝策略，也可以选择JDK提供的四种已有拒绝策略，其特点如下：
![拒绝策略](https://img-blog.csdnimg.cn/img_convert/f7f391628940c6cfe8ba7e568ef6a03d.png#pic_center)

**Worker线程**：
Worker这个工作线程，实现了Runnable接口，并持有一个线程Thread，一个初始化的任务firstTask。thread是在调用构造方法时通过ThreadFactory来创建的线程，firstTask用它来保存传入的第一个任务，这个任务可以有也可以为null。如果这个值是非空的，那么线程就会在启动初期立即执行这个任务，也就对应核心线程创建时的情况；如果这个值是null，那么就需要创建一个线程去执行任务列表（workQueue）中的任务，也就是非核心线程的创建。

线程池需要管理线程的生命周期，需要在线程长时间不运行的时候进行回收。线程池使用一张Hash表去持有线程的引用，这样可以通过添加引用、移除引用这样的操作来控制线程的生命周期。这个时候重要的就是如何判断线程是否在运行。

Worker是通过继承AQS，使用AQS来实现独占锁这个功能。没有使用可重入锁ReentrantLock，而是使用AQS，为的就是实现不可重入的特性去反应线程现在的执行状态。

**addWorker增加工作线程**：

```java
private boolean addWorker(Runnable firstTask, boolean core) {
}
```
addWorker方法有两个参数：firstTask、core。firstTask参数用于指定新增的线程执行的第一个任务，该参数可以为空；core参数为true表示在新增线程时会判断当前活动线程数是否少于corePoolSize，false表示新增线程前需要判断当前活动线程数是否少于maximumPoolSize

**执行流程**：
![执行流程](https://img-blog.csdnimg.cn/img_convert/e21ae15778df5b8028bb9088424d196a.png#pic_center)
**参考**：

 1. [Java线程池实现原理](https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html)
