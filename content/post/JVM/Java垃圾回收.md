---
title:      "Java垃圾回收"
date:       2021-03-25
author: "shuyou"
categories: ["Code"]
tags:
    - JVM
---
>本文介绍Java垃圾回收相关知识

### 判断一个对象是否可以被回收
回收对象首先需要判断这个对象是否可以被回收，Java虚拟机采用可达性分析算法判断。

**引用计数算法**

给对象添加一个引用计数器，当对象增加一个引用时计数器加一，减少一个引用时计数器减一。引用计数为 0 的对象可被回收。

两个对象出现循环引用的情况下，此时引用计数器永远不为 0，导致无法对它们进行回收。

正因为循环引用的存在，因此 Java 虚拟机不使用引用计数算法。


**可达性分析算法**
通过 GC Roots 作为起始点进行搜索，能够到达到的对象都是存活的，不可达的对象可被回收。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210325111314120.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
Java 虚拟机使用该算法来判断对象是否可被回收，在 Java 中 GC Roots 一般包含以下内容:

 - 虚拟机栈中引用的对象
 - 本地方法栈中引用的对象
 - 方法区中类静态属性引用的对象
 - 方法区中常量引用的对象

**方法区的回收**

方法区的垃圾回收主要包括两部分：废弃的变量和不再使用的类型。

判断一个常量是否废弃：当没有其他对象引用这个常量时，Java虚拟机会对这个常量进行回收。

判断一个类型是否属于不再使用的类：

 - 该类所有的实例都已经被回收，也就是堆中不存在该类的任何实例。 
 - 加载该类的 ClassLoader 已经被回收。
 -  该类对应的 Class 对象没有在任何地方被引用，也就无法在任何地方通过反射访问该类方法。

### 引用类型
**强引用**
被强引用关联的对象不会被回收。

使用 new 一个新对象的方式来创建强引用。

```java
	Object obj = new Object();
```

**软引用**
被软引用关联的对象，只有在虚拟机内存不足时才会被回收

使用 SoftReference 类来创建软引用。
```java
	Object obj = new Object();
	SoftReference<Object> sf = new SoftReference<Object>(obj);
	obj = null;  // 使对象只被软引用关联
```

**弱引用**
被弱引用关联的对象，在虚拟机下一次GC时会被回收

使用 WeakReference 类来实现弱引用。
```java
	Object obj = new Object();
	WeakReference<Object> sf = new WeakReference<Object>(obj);
	obj = null;  // 使对象只被软引用关联
```

**虚引用**
又称为幽灵引用或者幻影引用。

一个对象是否有虚引用的存在，完全不会对其生存时间构成影响，也无法通过虚引用取得一个对象。 

为一个对象设置虚引用关联的唯一目的就是能在这个对象被回收时收到一个系统通知。 

使用 PhantomReference 来实现虚引用。

```java
	Object obj = new Object();
	PhantomReference<Object> pf = new PhantomReference<Object>(obj);
	obj = null;
```
### 垃圾回收算法
**标记-清除**
![](https://img-blog.csdnimg.cn/20210325132146534.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
首先标记所有需要回收的对象，标记完成后进行统一的回收，也可以反过来标记存活的对象，统一回收所有未被标记的对象。

缺点：

 1. 执行效率不稳定，标记和清除过程效率都不高；
 2. 内存空间的碎片化

**标记-整理**
![](https://img-blog.csdnimg.cn/20210325132518976.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
在标记-清楚算法的基础上，让所有存活的对象都向一端移动，然后直接清理掉端边界以外的内存。

**标记-复制**
![](https://img-blog.csdnimg.cn/2021032513285885.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
将内存划分为大小相等的两块，每次只使用其中一块，当这一块内存用完了就将还存活的对象复制到另一块上面，然后再把使用过的内存空间进行一次清理。

主要不足是只使用了内存的一半。

现在的商业虚拟机都采用标记-复制算法来回收新生代，但是并不是将新生代分为大小相等的两块，而是分为一块较大的Eden空间和两块较小的Survivor空间。

每次使用Eden空间和其中一块Survivor，在回收时，在回收时，将 Eden 和 Survivor 中还存活着的对象一次性复制到另一块 Survivor 空间上，最后清理 Eden 和使用过的那一块 Survivor。

HotSpot 虚拟机的 Eden 和 Survivor 的大小比例默认为 8:1，保证了内存的利用率达到 90%。如果每次回收有多于 10% 的对象存活，那么一块 Survivor 空间就不够用了，此时需要依赖于老年代进行分配担保，也就是借用老年代的空间存储放不下的对象

**分代收集器**

现在的商业虚拟机采用分代收集算法，它根据对象存活周期将内存分为几块，不同块采用适当的收集算法。

一般将堆分为新生代和老年代：

 - 新生代使用 标记-复制 算法
 - 老年代使用 标记-整理 或者 标记-清除 算法

### 内存分配与回收策略

**Minor GC 和 Full GC**

 - Minor GC发生在新生代上，因为新生代上对象存活时间很短，所以Minor GC会频繁执行，执行的速度一般也很快。
 - Full GC发生在老年代，老年代对象存活时间长，因此Full GC很少执行，执行速度也比Minor GC慢很多

**内存分配策略**

 - 对象优先在Eden上分配
 - 大对象直接进入老年代
 - 长期存活的对象进入老年代
 - 动态对象年龄判定
 - 空间分配担保

**回收条件**

对于 Minor GC，其触发条件非常简单，当 Eden 空间满时，就将触发一次 Minor GC。而 Full GC 则相对复杂，有以下条件:

 - 调用 System.gc()
 - 老年代空间不足
 - 空间分配担保失败
 - JDK 1.7 及以前的永久代空间不足
 - Concurrent Mode Failure

**参考**

 1. 深入理解Java虚拟机
 2. [Java 垃圾回收基础](https://www.pdai.tech/md/java/jvm/java-jvm-gc.html)
