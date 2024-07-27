---
title:      "阻塞队列BlockingQueue"
date:       2021-04-18
author: "shuyou"
categories: ["Code"]
tags:
    - Java并发
---

>本文介绍BlockingQueue阻塞队列相关知识

### 简介
BlockingQueue是JUC包下的一个接口，通常用于一个线程生产对象，而另外一个线程消费这些对象的场景。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210417171853751.png)

**方法**：
BlockingQueue继承Queue接口，因此，对数据元素的基本操作有：
> 插入元素
1. add(E e) ：往队列插入数据，当队列满时，插入元素时会抛出IllegalStateException异常；
2. offer(E e)：当往队列插入数据时，插入成功返回`true`，否则则返回`false`。

> 删除元素
1. remove(Object o)：从队列中删除数据，成功则返回`true`，否则为`false`
2. poll：删除数据，当队列为空时，返回null；

> 查看元素
1. element：获取队头元素，如果队列为空时则抛出NoSuchElementException异常；
2. peek：获取队头元素，如果队列为空则抛出NoSuchElementException异常

BlockingQueue具有的特殊操作：

> 插入数据：
1. put：当阻塞队列容量已经满时，往阻塞队列插入数据的线程会被阻塞，直至阻塞队列已经有空余的容量可供使用；
2. offer(E e, long timeout, TimeUnit unit)：若阻塞队列已经满时，同样会阻塞插入数据的线程，直至阻塞队列已经有空余的地方，与put方法不同的是，该方法会有一个超时时间，若超过当前给定的超时时间，插入数据的线程会退出；

> 删除数据
1. take()：当阻塞队列为空时，获取队头数据的线程会被阻塞；
2. poll(long timeout, TimeUnit unit)：当阻塞队列为空时，获取数据的线程会被阻塞，另外，如果被阻塞的线程超过了给定的时长，该线程会退出

### 常用实现类
**ArrayBlockingQueue**：
ArrayBlockingQueue是由数组实现的有界队列，ArrayBlockingQueue可作为“有界数据缓冲区”，生产者插入数据到队列容器中，并由消费者提取。ArrayBlockingQueue一旦创建，容量不能改变。

从ArrayBlockingQueue的构造函数中可以看出，线程访问队列默认是非公平的，但是可以调用另一个构造函数进行设置。

当队列容量满时，尝试将元素放入队列将导致操作阻塞;尝试从一个空队列中取一个元素也会同样阻塞。

```java
    public ArrayBlockingQueue(int capacity) {
        this(capacity, false);
    }

    public ArrayBlockingQueue(int capacity, boolean fair) {
        if (capacity <= 0)
            throw new IllegalArgumentException();
        this.items = new Object[capacity];
        lock = new ReentrantLock(fair);
        notEmpty = lock.newCondition();
        notFull =  lock.newCondition();
    }
```

**LinkedBlockingQueue**:
LinkedBlockingQueue是用链表实现的有界阻塞队列，同样满足FIFO的特性，与ArrayBlockingQueue相比起来具有更高的吞吐量，为了防止LinkedBlockingQueue容量迅速增，损耗大量内存。通常在创建LinkedBlockingQueue对象时，会指定其大小，如果未指定，容量等于Integer.MAX_VALUE。

**LinkedBlockingDeque**:
LinkedBlockingDeque是基于链表数据结构的有界阻塞双端队列，如果在创建对象时为指定大小时，其默认大小为Integer.MAX_VALUE。与LinkedBlockingQueue相比，主要的不同点在于LinkedBlockingDeque具有双端队列的特性。

**LinkedTransferQueue**:
LinkedTransferQueue是一个由链表数据结构构成的无界阻塞队列，由于该队列实现了TransferQueue接口，与其他阻塞队列相比主要有以下不同的方法：

transfer(E e): 如果当前有线程（消费者）正在调用take()方法或者可延时的poll()方法进行消费数据时，生产者线程可以调用transfer方法将数据传递给消费者线程。如果当前没有消费者线程的话，生产者线程就会将数据插入到队尾，直到有消费者能够进行消费才能退出；

tryTransfer(E e): tryTransfer方法如果当前有消费者线程（调用take方法或者具有超时特性的poll方法）正在消费数据的话，该方法可以将数据立即传送给消费者线程，如果当前没有消费者线程消费数据的话，就立即返回false。因此，与transfer方法相比，transfer方法是必须等到有消费者线程消费数据时，生产者线程才能够返回。而tryTransfer方法能够立即返回结果退出。

tryTransfer(E e,long timeout,imeUnit unit)
与transfer基本功能一样，只是增加了超时特性，如果数据才规定的超时时间内没有消费者进行消费的话，就返回false。

**PriorityBlockingQueue**:
 - PriorityBlockingQueue是一个支持优先级的无界阻塞队列（容量不够时会自动扩容,是二叉树最小堆的实现）。默认情况下元素采用自然顺序进行排序，也可以通过自定义类实现compareTo()方法来指定元素排序规则，或者初始化时通过构造器参数Comparator来指定排序规则。
 - 它的 take 方法在队列为空的时候会阻塞，但是正因为它是无界队列，而且会自动扩容，所以它的队列永远不会满，所以它的 put 方法永远不会阻塞，添加操作始终都会成功。

**SynchronousQueue**：

 - synchronousQueue 是一个不存储任何元素的阻塞队列，每一个put操作必须等待take操作，否则不能添加元素。同时它也支持公平锁和非公平锁。
 - synchronousQueue 的容量并不是1，而是0。因为它本身不会持有任何元素，它是直接传递的，synchronousQueue 会把元素从生产者直接传递给消费者，在这个过程中能够是不需要存储的。
 - 线程池 CachedThreadPool 就是利用了该队列，Executors.newCachedThreadPool()，因为这个线程池它的最大线程数是Integer.MAX_VALUE，它是更具需求来创建线程，所有的线程都是临时线程，使用完后空闲60秒则被回收，

**DelayQueue**：

 - DelayQueue 是一个使用PriorityBlockingQueue的延迟获取的无界队列。具有“延迟”的功能。
 - DelayQueue 应用场景：1. 缓存系统的设计：可以用DelayQueue保存缓存元素的有效期，使用一个线程循环查询DelayQueue，一旦能从DelayQueue中获取元素时，表示缓存有效期到了。2. 定时任务调度。使用DelayQueue保存当天将会执行的任务和执行时间，一旦从DelayQueue中获取到任务就开始执行，从比如TimerQueue就是使用DelayQueue实现的。
 - DelayQueue是一个存放实现Delayed接口的数据的无界阻塞队列，只有当数据对象的延时时间达到时才能插入到队列进行存储。如果当前所有的数据都还没有达到创建时所指定的延时期，则队列没有队头，并且线程通过poll等方法获取数据元素则返回null。所谓数据延时期满时，则是通过Delayed接口的getDelay(TimeUnit.NANOSECONDS)来进行判定，如果该方法返回的是小于等于0则说明该数据元素的延时期已满。

**参考**：

 1. [并发容器之BlockingQueue](https://github.com/CL0610/Java-concurrency/blob/master/19.%E5%B9%B6%E5%8F%91%E5%AE%B9%E5%99%A8%E4%B9%8BBlockingQueue/%E5%B9%B6%E5%8F%91%E5%AE%B9%E5%99%A8%E4%B9%8BBlockingQueue.md)
 2. [JAVA中常见的阻塞队列详解](https://segmentfault.com/a/1190000038178346)
 3. [并发队列-无界阻塞优先级队列PriorityBlockingQueue原理探究](https://cloud.tencent.com/developer/article/1330391)
 4. [Java-BlockingQueue 接口5大实现类的使用场景](https://cloud.tencent.com/developer/article/1636024)
