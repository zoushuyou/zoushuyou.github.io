---
title:      "Java并发基础"
date:       2021-03-08
author: "shuyou"
categories: ["Code"]
tags:
    - Java并发
---
>本篇介绍Java并发的基础知识，主要包括线程安全，共享变量的内存可见性，synchronized和volatile关键字，指令重排序，伪共享等相关知识。

### 并发与并行

 - 并发是指同一时间段内多个任务执行。
 - 并行是指同一时刻，多个任务同时执行。
   

**并发是单位时间内，一个CPU切换时间片对多个任务进行处理**

**并行是同一时刻，多个CPU对多个任务同时进行处理**

### 线程安全
**共享资源**：该资源被多个线程所持有。

**线程安全问题是指当多线程同时读写一个共享资源并且没有任何同步措施时，导致出现脏数据或者其他不可预见的结果的问题**

### Java中共享变量的内存可见性
Java内存模型规定，将所有变量存放在主内存中，当线程使用变量时，会把主内存里面的变量复制到自己的工作内存，线程读写变量时操作的是自己工作内存中的变量。
![内存模型](https://img-blog.csdnimg.cn/20210305182228132.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
当线程A和线程B同时处理一个共享变量X。

 - 线程A首先获取共享变量X的值，由于两级Cache都没有命中，所以加载主内存中X的值，假如是0，然后把X=0缓存到二级缓存，并刷新到主内存。此时二级缓存和主内存中X的值都是1。
 - 线程B获取X的值，一级缓存未命中，二级缓存命中，返回X=1。然后线程B将X的值改为2，并缓存到二级缓存，刷新到主内存。此时二级缓存和主内存中X的值都是1
 - 线程A再次获取X的值，一级缓存命中，此时线程A工作内存中的X=1。这样就出现了问题，二级缓存和主内存中X的值已经被线程B修改为2了。这就是共享变量的内存不可见问题，也就是线程B写入的值对线程A不可见。

### Java中的原子性操作和指令重排序
**所谓原子性操作，是指在执行一系列操作时，要么全部执行，要么全部不执行，不存在只执行其中一部分的情况。**

**指令重排序**：Java内存模型运行编译器和处理器对指令重排序以提高运行效率，只会对不存在数据依赖的指令重排序。重排序在单线程下可以保证最终的执行结果，在多线程下不能保证。


### synchronized和volatile关键字
**synchronized**：

 - synchronized块是Java提供的一种原子性内置锁，内置锁是排它锁，也就是当一个线程获取该锁时，其他线程必须等待该线程释放锁后才能获取该锁。
 - 进入synchronized块的内存语义是把synchronized块内使用到的变量从线程工作内存中清除，这样线程使用到的变量会从主内存中获取。退出synchronized块的内存语义是把synchronized块内对共享变量的修改刷新到主内存。
 - synchronized关键字保证了原子性、共享变量的内存可见性、有序性。这里注意的是，synchronized没有禁止指令重排序，但是却保证了有序性，这是因为synchronized块中只能有一个线程运行，所以保证了最终执行的结果。

**volatile**：

 - 对于解决内存可见性问题，使用锁太笨重，因为它会带来线程上下文切换开销。volatile关键字确保对一个变量的更新对其他线程可见。
 - 写入volatile的内存语义是将写入线程工作内存的变量刷新到主内存，读取volatile的内存语义是先清空线程的工作内存再从主内存中读取。
 - volatile关键字只保证共享变量的内存可见性，并且禁止指令重排序，但不保证原子性。
 
 
### 伪共享
**缓存行（Cache line）**：在高速缓存Cache内部，是按行存储的，每一行被称为一个缓存行。缓存行是Cache与主内存进行数据交换的单位。Cache行的大小一般为2的幂次方字节。

**伪共享**：当多个线程，修改一个缓存行中的多个变量时，由于同时只能有一个线程操作缓存行（这就没有做到多个线程同时操作多个变量），所以相比将每个变量放到不同的缓存行，性能会下降，这就是伪共享。

### Java中的CAS操作

**CAS**：compare and swap，是JDK提供的非阻塞原子性操作，它通过硬件保证了比较--更新操作的原子性。

 -     public final native boolean compareAndSwapObject(Object var1, long var2, Object var4, Object var5);
 -     public final native boolean compareAndSwapInt(Object var1, long var2, int var4, int var5);
 -     public final native boolean compareAndSwapLong(Object var1, long var2, long var4, long var6);

JDK中的Unsafe类提供了这三种CAS方法，有四个操作数，分别为：对象的内存位置，对象的变量的偏移量，变量预期值，变量新的值。

**ABA问题**：ABA问题是指，线程1获取变量X的值A后在使用CAS修改X的值之前，线程2使用CAS修改X的值为B，然后又使用CAS修改X的值为A，此时线程1获取的X的值A已经不是之前获取的A了。
给每个变量的状态值，配备时间戳可避免ABA问题。

