---
title: "Disruptor源码分析"
date: 2021-10-20
author: "shuyou"
categories: ["Code"]
tags:
    - Disruptor
---

>本文简单分析下Disruptor的原理

# 简介

Disruptor是一个高性能队列，它是系统内部的内存队列，而不是Kafka这样的分布式队列。

由于Java内置的队列，会出现加锁和伪共享等影响性能的问题，所以公司项目里使用了Disruptor框架。

Disruptor采用生产者-消费者模式，并使用环形数组结构，无锁设计，拥有很高的性能。

# 环形数组队列

先介绍下 Disruptor 的环形数组 RingBuffer

```java
    public static final long INITIAL_CURSOR_VALUE = -1L;
    private final int indexMask;
    private final Object[] entries;
    private final int bufferSize;
    private final Sequencer sequencer;
```

这是 RingBuffer 类中的变量，比较重要的变量：
-   entries     环形数组 生产者生产的类就放在这个数组中
-   bufferSize  环形数组的大小
-   sequencer   序列号 用于事件发布者和事件处理者在ringbuffer上相互追逐，标记它们的相对位置

**next()**
```java
    public long next() {
        return this.sequencer.next();
    }
```
返回下一个可用的序列号

**get()**
```java
    public E get(long sequence) {
        return this.entries[(int)sequence & this.indexMask];
    }
```
返回生产者生产的消息，消息对象里面的内容是空的，需要指定值

**publish()**
```java
    public void publish(long sequence) {
        this.sequencer.publish(sequence);
    }
```
发布消费者可用序列，只有发布了，消费者才能看见。


# 序列

**Sequence 是 Disruptor 中的序列类，主要用于生成序列号**

在 Sequence 类中，可以看到避免伪共享的相关代码，主要就是 long 类型的，使用了长度为16的 long 类型的数组进行填充，这样可以有效的避免伪共享。

也采用了CAS相关操作，可以提高性能。

```java
public class Sequence {
    static final long INITIAL_VALUE = -1L;
    private static final Unsafe UNSAFE = Util.getUnsafe();
    private static final long VALUE_OFFSET;
    private final long[] paddedValue;

    public Sequence() {
        this(-1L);
    }

    public Sequence(long initialValue) {
        this.paddedValue = new long[15];
        UNSAFE.putOrderedLong(this.paddedValue, VALUE_OFFSET, initialValue);
    }

    public long get() {
        return UNSAFE.getLongVolatile(this.paddedValue, VALUE_OFFSET);
    }

    public void set(long value) {
        UNSAFE.putOrderedLong(this.paddedValue, VALUE_OFFSET, value);
    }

    public void setVolatile(long value) {
        UNSAFE.putLongVolatile(this.paddedValue, VALUE_OFFSET, value);
    }

    public boolean compareAndSet(long expectedValue, long newValue) {
        return UNSAFE.compareAndSwapLong(this.paddedValue, VALUE_OFFSET, expectedValue, newValue);
    }

    public long incrementAndGet() {
        return this.addAndGet(1L);
    }

    public long addAndGet(long increment) {
        long currentValue;
        long newValue;
        do {
            currentValue = this.get();
            newValue = currentValue + increment;
        } while(!this.compareAndSet(currentValue, newValue));

        return newValue;
    }

    public String toString() {
        return Long.toString(this.get());
    }

    static {
        int base = UNSAFE.arrayBaseOffset(long[].class);
        int scale = UNSAFE.arrayIndexScale(long[].class);
        VALUE_OFFSET = (long)(base + scale * 7);
    }
}
```

**Sequencer 接口，它的很多功能是提供给事件发布者使用的。SequenceBarrier 是给事件处理者使用的。**

**next()**

采用自旋CAS的方式，获取下一个序列。

```java
    public long next(int n) {
        if (n < 1) {
            throw new IllegalArgumentException("n must be > 0");
        } else {
            long current;
            long next;
            do {
                while(true) {
                    current = this.cursor.get();
                    next = current + (long)n;
                    long wrapPoint = next - (long)this.bufferSize;
                    long cachedGatingSequence = this.gatingSequenceCache.get();
                    if (wrapPoint <= cachedGatingSequence && cachedGatingSequence <= current) {
                        break;
                    }

                    long gatingSequence = Util.getMinimumSequence(this.gatingSequences, current);
                    if (wrapPoint > gatingSequence) {
                        LockSupport.parkNanos(1L);
                    } else {
                        this.gatingSequenceCache.set(gatingSequence);
                    }
                }
            } while(!this.cursor.compareAndSet(current, next));

            return next;
        }
    }
```

# 处理事件

几个重要的类：
-   WorkProcessor：此类是事件处理类，实现了 Runnable 接口
-   WorkPool：对处理序列 Sequence 和处理类 WorkProcessor 的封装类
-   WorkerPoolInfo：实现了 ConsumerInfo 类，对 WorkerPool 和SequenceBarrier 的封装类
-   ConsumerRepository：消费仓库

**处理流程**：

1.  调用 disruptor.handleEventsWithWorkerPool 初始化 Disruptor 时，会向 consumerRepository 消费仓库中添加 WorkerPoolInfo （包装了WorkerPool （将 ringBuffer 对象传入）和 SequenceBarrier）
2.  调用 disruptor.start 时，会从consumerRepository 消费仓库中取出 ConsumerInfo 即 WorkerPoolInfo,并调用其 start 方法
3.  WorkerPoolInfo 的 start 方法 会调用当前 workerPool 的 start 方法，WorkerPool 的 start 方法会使用传进来的线程池去执行 WorkProcessor
4.  在 WorkProcessor 的 run 方法中会调用 WorkHandler 的 onEvent 方法，即自己定义的消费者类


**参考：**
1.  [disruptor-3.3.2源码解析汇总](https://www.iteye.com/blog/brokendreams-2255720)
2.  [高性能队列——Disruptor](https://tech.meituan.com/2016/11/18/disruptor.html)
3.  [Disruptor使用代码案例](https://github.com/zq2599/blog_demos/tree/master/disruptor-tutorials)