---
title:      "深入了解ReentrantReadWriteLock"
date:       2021-03-10
author: "shuyou"
categories: ["Code"]
tags:
    - Java并发
---

>本文分析JDK1.8中的ReentrantReadWriteLock类

### 简介
由于ReentrantLock是独占锁，某时只有一个线程可以获取该锁，而实际中会有写少读多的场景，所以ReentrantReadWriteLock应运而生，采用读写分离的策略，允许多个线程同时获取该锁。

ReentrantReadWriteLock即可重入读写锁，内部维护一个ReadLock和一个WriteLock，他们依赖Sync来实现，而Sync继承AbstractQueuedSynchronizer，并且也提供了公平和非公平的实现。

### 内部类
![内部类](https://img-blog.csdnimg.cn/20210309140028298.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70#pic_center)
**Sync**

抽象类Sync继承自AQS
```java
abstract static class Sync extends AbstractQueuedSynchronizer {}
```

一些属性
```java
		//高16位为读锁，低16位为写锁
        static final int SHARED_SHIFT   = 16;
        //共享锁读锁 状态单位值65536
        static final int SHARED_UNIT    = (1 << SHARED_SHIFT);
        //共享锁读锁 最大个数65535
        static final int MAX_COUNT      = (1 << SHARED_SHIFT) - 1;
        //排它锁写锁掩码 15个1
        static final int EXCLUSIVE_MASK = (1 << SHARED_SHIFT) - 1;

        // 返回读锁线程数   c右移 16位
        static int sharedCount(int c)    { return c >>> SHARED_SHIFT; }
        //返回写锁可重入个数   c & 15个1
        static int exclusiveCount(int c) { return c & EXCLUSIVE_MASK; }
	    //本地线程计数器
	    private transient ThreadLocalHoldCounter readHolds;
	    //缓存计数器
	    private transient HoldCounter cachedHoldCounter;
	    //第一个读线程
	    private transient Thread firstReader = null;
	    //第一个读线程的计数
	    private transient int firstReaderHoldCount;
```

Sync内部类

```java
		
        static final class HoldCounter {
        	//重入的次数
            int count = 0;
            //线程id
            final long tid = getThreadId(Thread.currentThread());
        }

        
        static final class ThreadLocalHoldCounter
            extends ThreadLocal<HoldCounter> {
            // 重写初始化方法，在没有进行set的情况下，获取的都是该HoldCounter值
            public HoldCounter initialValue() {
                return new HoldCounter();
            }
        }
```
### 锁的获取与释放
**WriteLock   写锁的获取与释放**

**lock**

```java
	public void lock() {
	    sync.acquire(1);
	}
    public final void acquire(int arg) {
    	//获取锁失败则插入AQS阻塞队列尾部
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
    protected final boolean tryAcquire(int acquires) {
		//当前线程
        Thread current = Thread.currentThread();
        //获取状态值
        int c = getState();
        //获取写线程数量
        int w = exclusiveCount(c);
        //c!=0 说明写锁或者读锁已经被某线程获取
        if (c != 0) {
            //w=0说明已经有线程获取了读锁返回false，w!=0并且当前线程不是写锁的拥有者，则返回false
            if (w == 0 || current != getExclusiveOwnerThread())
                return false;
            //超过最高写线程数量
            if (w + exclusiveCount(acquires) > MAX_COUNT)
                throw new Error("Maximum lock count exceeded");
            // 设置AQS状态
            setState(c + acquires);
            return true;
        }
        //c == 0 说明目前没有线程获取到读锁和写锁，非公平锁则线程抢占式执行CAS尝试获取写锁
        if (writerShouldBlock() ||
            !compareAndSetState(c, c + acquires))
            return false;
        // 设置独占线程
        setExclusiveOwnerThread(current);
        return true;
    }

```
首先会获取state，判断是否为0，若为0，表示此时没有读锁线程，再判断写线程是否应该被阻塞，而在非公平策略下线程抢占式执行CAS尝试获取写锁，在公平策略下会进行判断(判断同步队列中是否有等待时间更长的线程，若存在，则需要被阻塞，否则，无需阻塞)，之后在设置状态state，然后返回true。若state不为0，则表示此时存在读锁或写锁线程，若写锁线程数量为0或者当前线程为独占锁线程，则返回false，表示不成功，否则，判断写锁线程的重入次数是否大于了最大值，若是，则抛出异常，否则，设置状态state，返回true，表示成功。
![流程图](https://img-blog.csdnimg.cn/2021030914442224.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70#pic_center)
**lockInterruptibly**
会对中断进行响应，也就是当其他线程调用了该线程的interrupt()方法中断了当前线程，当前线程会抛出异常InterruptedException。

**unlock**

```java
	//释放写锁
    public void unlock() {
        sync.release(1);
    }
	
    public final boolean release(int arg) {
    	//释放锁成功，取AQS阻塞队列的头节点，并激活
		if (tryRelease(arg)) {
		   	Node h = head;
		   	if (h != null && h.waitStatus != 0)
		       	unparkSuccessor(h);
		   	return true;
		}
		return false;
    }
	protected final boolean tryRelease(int releases) {
		//是否是写锁拥有者调用的unlock
	     if (!isHeldExclusively())
	         throw new IllegalMonitorStateException();
	     //释放写锁后的 写锁的数量
	     int nextc = getState() - releases;
	     boolean free = exclusiveCount(nextc) == 0;
	     //写锁数量为0 则释放锁
	     if (free)
	         setExclusiveOwnerThread(null);
	     //更新状态值
	     setState(nextc);
	     return free;
	 }
```
首先会判断该线程是否为独占线程，若不为独占线程，则抛出异常，否则，计算释放资源后的写锁的数量，若为0，表示成功释放，资源不将被占用，否则，表示资源还被占用。其函数流程图如下。

**ReadLock   读锁的获取与释放**
**lock**

```java
    public void lock() {
        sync.acquireShared(1);
    }
    
    public final void acquireShared(int arg) {
    	//获取锁，如果返回值<0说明失败了
        if (tryAcquireShared(arg) < 0)
        	//加入队列 自旋去获取锁
            doAcquireShared(arg);
    }
    
    protected final int tryAcquireShared(int unused) {
		//获取当前线程
        Thread current = Thread.currentThread();
        //获取状态
        int c = getState();
        //有写锁占用并且不是当前线程，则直接返回获取失败
        if (exclusiveCount(c) != 0 &&
            getExclusiveOwnerThread() != current)
            return -1;
        //获取读锁的线程数
        int r = sharedCount(c);
        // 读线程是否应该被阻塞、并且小于最大值、并且比较设置成功
        if (!readerShouldBlock() &&
            r < MAX_COUNT &&
            compareAndSetState(c, c + SHARED_UNIT)) {
            // 如果读锁持有数为0，则说明当前线程是第一个reader，分别给firstReader和firstReaderHoldCount初始化
            if (r == 0) {
                firstReader = current;
                firstReaderHoldCount = 1;
            } else if (firstReader == current) {// 如果读锁持有数不为0且当前线程就是firstReader，那么直接给firstReaderHoldCount+1，表示读锁重入
                firstReaderHoldCount++;
            } else {// 读锁数量不为0并且不为当前线程
                HoldCounter rh = cachedHoldCounter;
                if (rh == null || rh.tid != getThreadId(current))
                    cachedHoldCounter = rh = readHolds.get();
                else if (rh.count == 0)
                    readHolds.set(rh);
                rh.count++;
            }
            return 1;
        }
        // 应该阻塞或者CAS失败则进入此方法获取锁
        return fullTryAcquireShared(current);
    }

    private void doAcquireShared(int arg) {
    	//将节点挂在到队列 并设置其为尾结点
        final Node node = addWaiter(Node.SHARED);
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (;;) {
            	//p是node的前节点
                final Node p = node.predecessor();
                if (p == head) {
                	// 如果前一个节点是头节点，则尝试获取锁
                    int r = tryAcquireShared(arg);
                    if (r >= 0) {//获取锁成功
                        setHeadAndPropagate(node, r);//设置头节点
                        p.next = null; // help GC
                        if (interrupted)
                            selfInterrupt();
                        failed = false;
                        return;
                    }
                }
                if (shouldParkAfterFailedAcquire(p, node) &&
                    parkAndCheckInterrupt())
                    interrupted = true;
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210310152508189.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70#pic_center)
**unlock**

```java
    public void unlock() {
        sync.releaseShared(1);
    }

    public final boolean releaseShared(int arg) {
        if (tryReleaseShared(arg)) {
            doReleaseShared();
            return true;
        }
        return false;
    }

    protected final boolean tryReleaseShared(int unused) {
    	//当前线程
        Thread current = Thread.currentThread();
        //当前线程是否为第一个读线程
        if (firstReader == current) {
            // assert firstReaderHoldCount > 0;
            //重入数为1 则置空
            if (firstReaderHoldCount == 1)
                firstReader = null;
            //可重入数-1
            else
                firstReaderHoldCount--;
        } else {
        	//得到缓存的计算
            HoldCounter rh = cachedHoldCounter;
            if (rh == null || rh.tid != getThreadId(current))
	            // 获取当前线程对应的计数器
                rh = readHolds.get();
            // 获取计数
            int count = rh.count;
            if (count <= 1) {
                readHolds.remove();
                if (count <= 0)
                    throw unmatchedUnlockException();
            }
            //计数-1
            --rh.count;
        }
        for (;;) {
            int c = getState();
            // 获取释放后状态
            int nextc = c - SHARED_UNIT;
            if (compareAndSetState(c, nextc)) //CAS自旋设置
                return nextc == 0;
        }
    }
    
    private void doReleaseShared() {
        for (;;) { //自旋激活等待节点
            Node h = head;
            if (h != null && h != tail) {
                int ws = h.waitStatus;
                if (ws == Node.SIGNAL) {
                    if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                        continue;            // loop to recheck cases
                    unparkSuccessor(h);
                }
                else if (ws == 0 &&
                         !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                    continue;                // loop on failed CAS
            }
            if (h == head)                   // loop if head changed
                break;
        }
    }
```
### ReentrantReadWriteLock的使用

```java
package thread3;

import java.util.ArrayList;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-03-09 14:55
 */
public class ReentrantReadWriteLockList {
    private ArrayList<String> array = new ArrayList<>();

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    private final Lock readLock = lock.readLock();

    private final Lock writeLock = lock.writeLock();

    public void add(String e){
        System.out.println(Thread.currentThread().getName() + "  try writeLock  lock    value   "+e);
        writeLock.lock();
        try {
            array.add(e);
        } catch (Exception exception) {
            exception.printStackTrace();
        }finally {
            writeLock.unlock();
            System.out.println(Thread.currentThread().getName() + "  try writeLock  unlock");
        }
    }

    public String get(int index){
        System.out.println(Thread.currentThread().getName() + "  try readLock lock");
        readLock.lock();
        try {
            return array.get(index);
        }catch (Exception e){
            return new String("越界访问");
        }
        finally {
            readLock.unlock();
        }
    }

    public static void main(String[] args) {
        ReentrantReadWriteLockList reentrantLockList = new ReentrantReadWriteLockList();

        for (int i = 0; i < 3; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    String s = String.valueOf(ThreadLocalRandom.current().nextInt(100));
                    reentrantLockList.add(s);
                }
            }).start();


            final int j = i;

            new Thread(new Runnable() {
                @Override
                public void run() {
                    System.out.println(Thread.currentThread().getName()+ "  try readLock  unlock value   " + reentrantLockList.get(j));
                }
            }).start();

            new Thread(new Runnable() {
                @Override
                public void run() {
                    System.out.println(Thread.currentThread().getName()+ "  try readLock  unlock value   " + reentrantLockList.get(j));
                }
            }).start();

        }
    }
}


```
**运行结果：**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210310181617979.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)

**小结**

 - ReentrantReadWriteLock 有公平和非公平两种机制，默认使用非公平锁。
 - 在线程持有读锁的情况下，该线程不能取得写锁(因为获取写锁的时候，如果发现当前的读锁被占用，就马上获取失败，不管读锁是不是被当前线程持有)。
 - 在线程持有写锁的情况下，该线程可以继续获取读锁（获取读锁时如果发现写锁被占用，只有写锁没有被当前线程占用的情况才会获取失败）。
 - 读锁能同时被多个线程持有，而写锁是独占锁同一时刻只能有一个线程持有。
 - 锁降级：线程获取写入锁后可以获取读取锁，然后释放写入锁，这样就从写入锁变成了读取锁，从而实现锁降级特性。
 - ReentrantReadWriteLock 使用int 类型的变量  高16为表示拥有读锁线程数，低16为表示写锁可重入数。

**参考**

 1. **Java并发编程之美**
 2. [JDK1.8源码分析之ReentrantReadWriteLock](https://www.cnblogs.com/leesf456/p/5419132.html)
 3. [读写锁——ReentrantReadWriteLock原理详解](https://cloud.tencent.com/developer/article/1469555)
