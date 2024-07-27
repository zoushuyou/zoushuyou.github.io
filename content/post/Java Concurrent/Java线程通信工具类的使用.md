---
title:      "Java线程通信工具类的使用"
date:       2021-03-12
author: "shuyou"
categories: ["Code"]
tags:
    - Java并发
---

>本文介绍一些Java线程常用通信工具类，主要介绍怎么使用。

### 简介
常见的线程间通信方法有：

 - wait()和notify() +加锁机制synchronized和lock
 - 还有线程的join()方法
 - Condition接口的awiat() 和 signAll()方法 + 加锁机制synchronized和lock
 - 生产者消费者模式

这里介绍一些JDK中java.util.concurrent包下的一些通信工具类。


|  类| 作用 |
|--|--|
| Semaphore | 限制线程的数量 |
| Exchanger | 两个线程交换数据 |
| CountDownLatch | 线程等待直到计数器减为0时开始工作 |
| CyclicBarrier | 作用跟CountDownLatch类似，但是可以重复使用 |

### 1.Semaphore
Semaphore即信号，以前学操作系统时，学过信号量机制。Semaphore往往用于资源有限的场景中，去限制线程的数量，这里介绍下这个类的使用。举个例子，我想限制同时只能有3个线程在工作：

```java
package threadcon;

import java.util.Random;
import java.util.concurrent.Semaphore;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-03-11 17:47
 */
public class SemaphoreDemo {
    static class MyThread implements Runnable {

        private int value;
        private Semaphore semaphore;

        public MyThread(int value, Semaphore semaphore) {
            this.value = value;
            this.semaphore = semaphore;
        }

        @Override
        public void run() {
            try {
                semaphore.acquire(); // 获取permit
                System.out.println(String.format("当前线程是%d, 还剩%d个资源，还有%d个线程在等待",
                        value, semaphore.availablePermits(), semaphore.getQueueLength()));
                // 睡眠随机时间，打乱释放顺序
                Random random =new Random();
                Thread.sleep(random.nextInt(1000));
                System.out.println(String.format("线程%d释放了资源", value));
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally{
                semaphore.release(); // 释放permit
            }
        }
    }

    public static void main(String[] args) {
        Semaphore semaphore = new Semaphore(3);
        for (int i = 0; i < 10; i++) {
            new Thread(new MyThread(i, semaphore)).start();
        }
    }
}

```
![运行结果](https://img-blog.csdnimg.cn/20210311182547119.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**原理：**

Semaphore(int)型构造函数
```java
public Semaphore(int permits) {
    sync = new NonfairSync(permits);
}
```
该构造函数会创建具有给定的许可数和非公平机制的Semaphore。

这里即设置AQS中的state为3，调用acquire会将state-1，调用release会将state+1。

与AQS的队列操作大同小异，这里不再详细介绍。

### 2.Exchanger
Exchanger类用于两个线程交换数据。它支持泛型，也就是说你可以在两个线程之间传送任何数据。

```java
package threadcon;

import java.util.concurrent.Exchanger;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-03-11 18:38
 */
public class ExchangerDemo {
    public static void main(String[] args) {
        Exchanger<String> exchanger =new Exchanger<>();

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String a = "这是来自线程A的数据";
                    System.out.println("这是线程A，得到了另一个线程的数据："
                            + exchanger.exchange(a) + " hashcode  " + exchanger.exchange(a).hashCode());
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        },"A").start();

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String b = "这是来自线程B的数据";
                    System.out.println("这是线程B，得到了另一个线程的数据："
                            + exchanger.exchange(b) + " hashcode  " + exchanger.exchange(b).hashCode());
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        },"A").start();
    }
}

```
![结果](https://img-blog.csdnimg.cn/20210311184215782.png)
Exchanger只能是两个线程交换数据吗？那三个调用同一个实例的exchange方法会发生什么呢？答案是只有前两个线程会交换数据，第三个线程会进入阻塞状态。

需要注意的是，exchange是可以重复使用的。也就是说。两个线程可以使用Exchanger在内存中不断地再交换数据。

### 3.CountDownLatch
先来解读一下CountDownLatch这个类名字的意义。CountDown代表计数递减，Latch是“门闩”的意思。也有人把它称为“屏障”。而CountDownLatch这个类的作用也很贴合这个名字的意义，假设某个线程在执行任务之前，需要等待其它线程完成一些前置任务，必须等所有的前置任务都完成，才能开始执行本线程的任务。

```java
package threadcon;

import java.util.concurrent.CountDownLatch;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-03-11 18:48
 */
public class CountDownLatchDemo {
    public static void main(String[] args) {
        CountDownLatch countDownLatch = new CountDownLatch(3);

        for (int i = 0; i < 3; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread().getName() + " is running ");
                    countDownLatch.countDown();

                }
            },"ThreadA "+ i + " ").start();
        }

        try {
            countDownLatch.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("ThreadAs run over");
        
        for (int i = 0; i < 5; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread().getName() + " is running ");
                    countDownLatch.countDown();

                }
            },"ThreadB "+ i + " ").start();
        }


    }
}

```
![运行结果](https://img-blog.csdnimg.cn/20210311190548176.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)

CountDownLatch类的内部同样是一个基层了AQS的实现类Sync，且实现起来还很简单，可能是JDK里面AQS的子类中最简单的实现了。

需要注意的是构造器中的计数值（count）实际上就是闭锁需要等待的线程数量。这个值只能被设置一次，而且CountDownLatch没有提供任何机制去重新设置这个计数值。
### 4.CyclicBarrier
CyclicBarrirer从名字上来理解是“循环的屏障”的意思。前面提到了CountDownLatch一旦计数值count被降为0后，就不能再重新设置了，它只能起一次“屏障”的作用。而CyclicBarrier拥有CountDownLatch的所有功能，还可以使用reset()方法重置屏障。

```java
package thread;

import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-03-12 9:37
 */
public class CyclicBarrierTest2 {

    private static CyclicBarrier cyclicBarrier = new CyclicBarrier(2, new Runnable() {
        @Override
        public void run() {
            System.out.println(Thread.currentThread().getName() + " step done");
        }
    });

    public static void main(String[] args) {
        ExecutorService executorService = Executors.newFixedThreadPool(2);


        executorService.submit(new Runnable() {
            @Override
            public void run() {

                for (int i = 0; i < 2; i++) {
                    System.out.println(Thread.currentThread().getName() +"  "+ i+ "  step  doing ");
                    try {
                        cyclicBarrier.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } catch (BrokenBarrierException e) {
                        e.printStackTrace();
                    }
                }
            }
        });

        executorService.submit(new Runnable() {
            @Override
            public void run() {
                for (int i = 0; i < 2; i++) {
                    System.out.println(Thread.currentThread().getName() +"  "+ i+ "  step  doing ");
                    try {
                        cyclicBarrier.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } catch (BrokenBarrierException e) {
                        e.printStackTrace();
                    }
                }
            }
        });

        executorService.shutdown();
    }
}

```
![运行结果](https://img-blog.csdnimg.cn/20210312094814110.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)

CyclicBarrier没有分为await()和countDown()，而是只有单独的一个await()方法。
一旦调用await()方法的线程数量等于构造方法中传入的任务总量（这里是2），就代表达到屏障了。CyclicBarrier允许我们在达到屏障的时候可以执行一个任务，可以在构造方法传入一个Runnable类型的对象。


**和CountDonwLatch再对比** 

 - CountDownLatch减计数，CyclicBarrier加计数。
 - CountDownLatch是一次性的，CyclicBarrier可以重用。
 - CountDownLatch和CyclicBarrier都有让多个线程等待同步然后再开始下一步动作的意思，但是CountDownLatch的下一步的动作实施者是主线程，具有不可重复性；而CyclicBarrier的下一步动作实施者还是“其他线程”本身，具有往复多次实施动作的特点。 

**参考**

 1. [JAVA线程通信工具类](http://concurrent.redspider.group/article/03/17.html)
 2. [JUC工具类: CyclicBarrier详解](https://www.pdai.tech/md/java/thread/java-thread-x-juc-tool-cyclicbarrier.html)
 3. JAVA并发编程之美

  