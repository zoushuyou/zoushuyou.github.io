---
title:      "深入了解ConcurrentHashMap"
date:       2021-03-03
author: "shuyou"
categories: ["Code"]
tags:
    - Java集合
---

>本文将深入源码分析ConcurrentHashMap的相关内容

### 1.ConcurrentHashMap简介
由于HashMap是非线程安全的，所以如果想在多线程下安全的操作Map，有下面几个解决方案：

 1. 使用HashTable
 2. 使用Collections.synchronizedMap
 3. 使用ConcurrentHashMap

**HashTable**
HashTable类是一个线程安全的类，它的底层给几乎所有的多线程操作方法都加上了synchronized关键字，相当于锁住整个HashTable，多线程访问时，只要有一个线程访问或操作该对象，其他线程只能阻塞等待锁的释放，性能非常差，所以HashTable不推荐使用。

**Collections.synchronizedMap**
底层也是使用对象锁来保证线程安全，本质上也相当于是全表锁。

**CocurrentHashMap**
**JDK1.7:**
在JDK1.7中，采用分段锁。所谓分段锁，是将HashMap中的Entry数组进行切割，分成许多小数组即Segment,Segment继承ReetrantLock（可重入锁）。
**JDK1.8**
在JDK1.8中，取消了Segment分段锁，采用CAS+synchronized来保证并发安全，synchronized只锁住table数组中链表或者红黑树的头节点，只要插入节点的hash不冲突,就不会产生线程竞争。

**jdk1.8中的ConcurrentHashMap相比于jdk1.7  锁的粒度更小，性能更好。**

### 2.底层数据结构
同jdk1.8中的HashMap一样，底层也采用了数组+链表/红黑树的数据结构，这样当hash冲突较多时，查询效率会更好。

Node和TreeNode同HashMap中的差不多，不过Node中的Value 和 next 用 volatile修饰
```java
	static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        //val和next都会在扩容时发生变化，所以加上volatile来保持可见性和禁止重排序
        volatile V val;
        volatile Node<K,V> next;

        Node(int hash, K key, V val, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.val = val;
            this.next = next;
        }

        public final K getKey()       { return key; }
        public final V getValue()     { return val; }
        public final int hashCode()   { return key.hashCode() ^ val.hashCode(); }
        public final String toString(){ return key + "=" + val; }
        public final V setValue(V value) {
            throw new UnsupportedOperationException();
        }

        public final boolean equals(Object o) {
            Object k, v, u; Map.Entry<?,?> e;
            return ((o instanceof Map.Entry) &&
                    (k = (e = (Map.Entry<?,?>)o).getKey()) != null &&
                    (v = e.getValue()) != null &&
                    (k == key || k.equals(key)) &&
                    (v == (u = val) || v.equals(u)));
        }

        /**
         * Virtualized support for map.get(); overridden in subclasses.
         */
        Node<K,V> find(int h, Object k) {
            Node<K,V> e = this;
            if (k != null) {
                do {
                    K ek;
                    if (e.hash == h &&
                        ((ek = e.key) == k || (ek != null && k.equals(ek))))
                        return e;
                } while ((e = e.next) != null);
            }
            return null;
        }
    }
```
**TreeBin**
TreeBin并不是红黑树的存储节点，TreeBin通过root属性维护红黑树的根结点，因为红黑树在旋转的时候，根结点可能会被它原来的子节点替换掉，在这个时间点，如果有其他线程要写这棵红黑树就会发生线程不安全问题，所以在ConcurrentHashMap中TreeBin通过waiter属性维护当前使用这棵红黑树的线程，来防止其他线程的进入。

```java
 	static final class TreeBin<K,V> extends Node<K,V> {
 		//指向TreeNode链表的根节点
        TreeNode<K,V> root;
        volatile TreeNode<K,V> first;
        volatile Thread waiter;
        volatile int lockState;
        // 锁的状态
        static final int WRITER = 1; // 持有写锁时的状态
        static final int WAITER = 2; // 等待写锁时的状态
        static final int READER = 4; // 增加数据时读锁的状态
			
		//构造函数 hash未 TREEBIN = -2，以b节点为头节点， 代表红黑树头节点hash<0
        TreeBin(TreeNode<K,V> b) {
            super(TREEBIN, null, null, null);
            this.first = b;
            TreeNode<K,V> r = null;
            for (TreeNode<K,V> x = b, next; x != null; x = next) {
                next = (TreeNode<K,V>)x.next;
                x.left = x.right = null;
                if (r == null) {
                    x.parent = null;
                    x.red = false;
                    r = x;
                }
                else {
                    K k = x.key;
                    int h = x.hash;
                    Class<?> kc = null;
                    for (TreeNode<K,V> p = r;;) {
                        int dir, ph;
                        K pk = p.key;
                        if ((ph = p.hash) > h)
                            dir = -1;
                        else if (ph < h)
                            dir = 1;
                        else if ((kc == null &&
                                  (kc = comparableClassFor(k)) == null) ||
                                 (dir = compareComparables(kc, k, pk)) == 0)
                            dir = tieBreakOrder(k, pk);
                            TreeNode<K,V> xp = p;
                        if ((p = (dir <= 0) ? p.left : p.right) == null) {
                            x.parent = xp;
                            if (dir <= 0)
                                xp.left = x;
                            else
                                xp.right = x;
                            r = balanceInsertion(r, x);
                            break;
                        }
                    }
                }
            }
            this.root = r;
            assert checkInvariants(root);
        }
	}

```
**ForwardingNode**
扩容用到的数据结构，代表正在进行扩容
```java
    static final class ForwardingNode<K,V> extends Node<K,V> {
        final Node<K,V>[] nextTable;
        //hash 为 MOVED = -1 代变正在进行扩容
        ForwardingNode(Node<K,V>[] tab) {
            super(MOVED, null, null, null);
            this.nextTable = tab;
        }
	}
```

### 3.常用方法
**put方法**

```java
    public V put(K key, V value) {
        return putVal(key, value, false);
    }

    final V putVal(K key, V value, boolean onlyIfAbsent) {
    	//key和value 都不能为null
        if (key == null || value == null) throw new NullPointerException();
        //获取key 的  hash
        int hash = spread(key.hashCode());
        int binCount = 0;
        for (Node<K,V>[] tab = table;;) {
            Node<K,V> f; int n, i, fh;
            if (tab == null || (n = tab.length) == 0)
            	//table 为 null 或者长度为 0  初始化table
                tab = initTable();
            // f 代表数组 hash&（n-1）位置的元素，如果f为null 则调用casTabAt方法利用Unsafe.compareAndSwapObject插入Node节点
            else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
                if (casTabAt(tab, i, null,
                             new Node<K,V>(hash, key, value, null)))
                    break;                   // no lock when adding to empty bin
            }
            //MOVED = -1 如果f.hash等于 -1 意味着有其它线程正在扩容，则当前线程一起进行扩容
            else if ((fh = f.hash) == MOVED)
            	//如果在进行扩容，则先进行扩容操作
                tab = helpTransfer(tab, f);
            else {
                V oldVal = null;
                //锁住链表或红黑树的头节点
                synchronized (f) {
                	//再次确认，防止其他线程修改
                    if (tabAt(tab, i) == f) {
                    	//hash >=0 说明时链表的节点，如果有相等的key，则修改它的value，否则在链表尾部插入 
                        if (fh >= 0) {
                            binCount = 1;
                            for (Node<K,V> e = f;; ++binCount) {
                                K ek;
                                if (e.hash == hash &&
                                    ((ek = e.key) == key ||
                                     (ek != null && key.equals(ek)))) {
                                    oldVal = e.val;
                                    if (!onlyIfAbsent)
                                        e.val = value;
                                    break;
                                }
                                Node<K,V> pred = e;
                                if ((e = e.next) == null) {
                                    pred.next = new Node<K,V>(hash, key,
                                                              value, null);
                                    break;
                                }
                            }
                        }
                        // f 是 TreeBin类型，则f为红黑树根节点
                        else if (f instanceof TreeBin) {
                            Node<K,V> p;
                            binCount = 2;
                            if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
                                                           value)) != null) {
                                oldVal = p.val;
                                if (!onlyIfAbsent)
                                    p.val = value;
                            }
                        }
                    }
                }
                if (binCount != 0) {
                	//binCount >= TREEIFY_THRESHOLD(默认是8) 则进行链表转红黑树操作
                    if (binCount >= TREEIFY_THRESHOLD)
                        treeifyBin(tab, i);
                    if (oldVal != null)
                        return oldVal;
                    break;
                }
            }
        }
        //扩容判断
        addCount(1L, binCount);
        return null;
    }
```

 1. 对要存放的元素，利用spread方法对key的hashcode进行一次hash运算，由运算后的 hash&（n-1）来确定这个元素应该存放在数组中的位置
 2. 如果当前table没有初始化，则先初始化数组table
 3. 如果数组当前位置为null，则使用CAS操作直接放入
 4. 如果这个位置存在节点，说明发生hash碰撞，首先根据此位置元素的hash判断数组是否正在进行扩容（(fh = f.hash) == MOVED），如果正在进行扩容，则一起进行扩容
 5. 如果没正在扩容，则判断当前节点是否为链表节点，依次向后遍历确定这个新加入的值所在位置。如果遇到hash值与key值都与新加入节点是一致的情况，则只需要更新value值即可。否则依次向后遍历，直到链表尾插入这个结点；
 6. 如果这个节点的类型是TreeBin的话，直接调用红黑树的插入方法进行插入新的节点；
 7. 插入完节点之后再次检查链表长度，如果长度大于8，就把这个链表转换成红黑树；
 8. 对当前容器存放的元素容量进行检查，如果超过临界值（实际大小 * 加载因子）就需要进行扩容



**initTable方法**
初始化table数组
```java
    private final Node<K,V>[] initTable() {
        Node<K,V>[] tab; int sc;
        //table为初始化才进行初始化
        while ((tab = table) == null || tab.length == 0) {
        	//sizeCtl默认为0 ，使用volatile修饰，当sizeCtl《0时，代表其他线程正在初始化，当前线程只需让出CPU时间片
            if ((sc = sizeCtl) < 0)
                Thread.yield();
            // 利用UnSafe.compareAndSwapInt,更改SIZECTL值为 -1 代表此时有线程在进行扩容
            else if (U.compareAndSwapInt(this, SIZECTL, sc, -1)) {
                try {
                	//再次确认table未初始化
                    if ((tab = table) == null || tab.length == 0) {
                        int n = (sc > 0) ? sc : DEFAULT_CAPACITY;
                        @SuppressWarnings("unchecked")
                        Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];
                        table = tab = nt;
                        sc = n - (n >>> 2);
                    }
                } finally {
                    sizeCtl = sc;
                }
                break;
            }
        }
        return tab;
    }
```
**helpTransfer方法**
帮助扩容

```java
    final Node<K,V>[] helpTransfer(Node<K,V>[] tab, Node<K,V> f) {
        Node<K,V>[] nextTab; int sc;
        // f 是 ForWardingNode 类型 且 f的nextTable 不为 null 
        if (tab != null && (f instanceof ForwardingNode) &&
            (nextTab = ((ForwardingNode<K,V>)f).nextTable) != null) {
            //帮忙扩容，得到一个标识
            int rs = resizeStamp(tab.length);
            // 如果 nextTab 没有被并发修改 且 tab 也没有被并发修改
        	// 且 sizeCtl  < 0 （说明还在扩容） 自旋
            while (nextTab == nextTable && table == tab &&
                   (sc = sizeCtl) < 0) {
                 // 如果 sizeCtl 无符号右移  16 不等于 rs （ sc前 16 位如果不等于标识符，则标识符变化了）
            	// 或者 sizeCtl == rs + 1  （扩容结束了，不再有线程进行扩容）（默认第一个线程设置 sc ==rs 左移 16 位 + 2，当第一个线程结束扩容了，就会将 sc 减一。这个时候，sc 就等于 rs + 1）
            	// 或者 sizeCtl == rs + 65535  （如果达到最大帮助线程的数量，即 65535）
            	// 或者转移下标正在调整 （扩容结束）
            	// 结束循环，返回 table
                if ((sc >>> RESIZE_STAMP_SHIFT) != rs || sc == rs + 1 ||
                    sc == rs + MAX_RESIZERS || transferIndex <= 0)
                    break;
                // 如果以上都不是, 将 sizeCtl + 1, （表示增加了一个线程帮助其扩容）    
                if (U.compareAndSwapInt(this, SIZECTL, sc, sc + 1)) {
                    transfer(tab, nextTab);
                    break;
                }
            }
            return nextTab;
        }
        return table;
    }

	static final int resizeStamp(int n) {
        return Integer.numberOfLeadingZeros(n) | (1 << (RESIZE_STAMP_BITS - 1));
    }
```
关于 sizeCtl 变量：

| 高RESIZE_STAMP_BITS位 |  低RESIZE_STAMP_SHIFT位|
|--|--|
| 扩容标记	 |并行扩容线程数 + 1 |



resizeStamp 方法返回一个与table容量n大小有关的扩容标记

 1. Integer.numberOfLeadingZeros(n)用于获取当前int从高位到低位第一个1前面0的个数。
 2. RESIZE_STAMP_BITS = 16  ，  1 << (RESIZE_STAMP_BITS - 1)  后的结果是 1左移15位 也就是  0000 0000 0000 0000 1000 0000 0000 0000

**addCount()方法**
put完元素的最后，对当前元素容量大小进行检查，判断是否需要扩容
```java
    private final void addCount(long x, int check) {
        CounterCell[] as; long b, s;
        // s = sumCount() 统计容器中元素的个数，并将 BASECOUNT +1 
        if ((as = counterCells) != null ||
            !U.compareAndSwapLong(this, BASECOUNT, b = baseCount, s = b + x)) {
            CounterCell a; long v; int m;
            boolean uncontended = true;
            if (as == null || (m = as.length - 1) < 0 ||
                (a = as[ThreadLocalRandom.getProbe() & m]) == null ||
                !(uncontended =
                  U.compareAndSwapLong(a, CELLVALUE, v = a.value, v + x))) {
                fullAddCount(x, uncontended);
                return;
            }
            if (check <= 1)
                return;
            s = sumCount();
        }
        //check就是binCount，该值在`putVal()`里面一定是>=0的，所以这个条件一定会为true
        if (check >= 0) {
            Node<K,V>[] tab, nt; int n, sc;
            //自旋
            while (s >= (long)(sc = sizeCtl) && (tab = table) != null &&
                   (n = tab.length) < MAXIMUM_CAPACITY) {
                int rs = resizeStamp(n);
                //已经有线程进行扩容
                if (sc < 0) {
                    if ((sc >>> RESIZE_STAMP_SHIFT) != rs || sc == rs + 1 ||
                        sc == rs + MAX_RESIZERS || (nt = nextTable) == null ||
                        transferIndex <= 0)
                        break;
                    //CAS  SIZECTL  增加一个线程帮助扩容
                    if (U.compareAndSwapInt(this, SIZECTL, sc, sc + 1))
                        transfer(tab, nt);
                }
                // 它是第一个扩容的线程，  SIZECTL  低16位 置为 0000 0000 0000 0010 
                else if (U.compareAndSwapInt(this, SIZECTL, sc,
                                             (rs << RESIZE_STAMP_SHIFT) + 2))
                    transfer(tab, null);
                s = sumCount();
            }
        }
    }
```
**transfer() 方法**
扩容方法

```java
private final void transfer(Node<K,V>[] tab, Node<K,V>[] nextTab) {
        int n = tab.length, stride;
         // 将 n / 8 然后除以 CPU核心数。如果得到的结果小于 16，那么就使用 16。
    	// 这里的目的是让每个 CPU 处理的桶一样多，避免出现转移任务不均匀的现象，如果桶较少的话，默认一个 CPU（一个线程）处理 16 个桶
        if ((stride = (NCPU > 1) ? (n >>> 3) / NCPU : n) < MIN_TRANSFER_STRIDE)
            stride = MIN_TRANSFER_STRIDE; // subdivide range
        // 新的 table 尚未初始化
        if (nextTab == null) {            // initiating
            try {
                @SuppressWarnings("unchecked")
                //新tab大小 为原来的2倍
                Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n << 1];
                nextTab = nt;
            } catch (Throwable ex) {      // try to cope with OOME
                sizeCtl = Integer.MAX_VALUE;
                return;
            }
            nextTable = nextTab;
            transferIndex = n;
        }
        int nextn = nextTab.length;
        ForwardingNode<K,V> fwd = new ForwardingNode<K,V>(nextTab);
        boolean advance = true;
        boolean finishing = false; // to ensure sweep before committing nextTab
        // 死循环,i 表示下标，bound 表示当前线程可以处理的当前桶区间最小下标
        for (int i = 0, bound = 0;;) {
            Node<K,V> f; int fh;
            while (advance) {
                int nextIndex, nextBound;
                // 对 i 减一，判断是否大于等于 bound （正常情况下，如果大于 bound 不成立，说明该线程上次领取的任务已经完成了。那么，需要在下面继续领取任务）
            // 如果对 i 减一大于等于 bound（还需要继续做任务），或者完成了，修改推进状态为 false，不能推进了。任务成功后修改推进状态为 true。
            // 通常，第一次进入循环，i-- 这个判断会无法通过，从而走下面的 nextIndex 赋值操作（获取最新的转移下标）。其余情况都是：如果可以推进，将 i 减一，然后修改成不可推进。如果 i 对应的桶处理成功了，改成可以推进。
                if (--i >= bound || finishing)
                    advance = false;
                else if ((nextIndex = transferIndex) <= 0) {
                    i = -1;
                    advance = false;
                }
                else if (U.compareAndSwapInt
                         (this, TRANSFERINDEX, nextIndex,
                          nextBound = (nextIndex > stride ?
                                       nextIndex - stride : 0))) {
                    bound = nextBound;
                    i = nextIndex - 1;
                    advance = false;
                }
            }
            if (i < 0 || i >= n || i + n >= nextn) {
                int sc;
                if (finishing) {
                    nextTable = null;
                    table = nextTab;
                    sizeCtl = (n << 1) - (n >>> 1);
                    return;
                }
                if (U.compareAndSwapInt(this, SIZECTL, sc = sizeCtl, sc - 1)) {
                    if ((sc - 2) != resizeStamp(n) << RESIZE_STAMP_SHIFT)
                        return;
                    finishing = advance = true;
                    i = n; // recheck before commit
                }
            }
            else if ((f = tabAt(tab, i)) == null)
                advance = casTabAt(tab, i, null, fwd);
            else if ((fh = f.hash) == MOVED)
                advance = true; // already processed
            else {
                synchronized (f) {
                    if (tabAt(tab, i) == f) {
                        Node<K,V> ln, hn;
                        if (fh >= 0) {
                        	// hash & n 之后，因 n为 2^m 判断 m位 为0 还是1 
                            int runBit = fh & n;
                            Node<K,V> lastRun = f;
                            for (Node<K,V> p = f.next; p != null; p = p.next) {
                                int b = p.hash & n;
                                if (b != runBit) {
                                    runBit = b;
                                    lastRun = p;
                                }
                            }
                            //为0  则 低位是 lastRun
                            if (runBit == 0) {
                                ln = lastRun;
                                hn = null;
                            }
                            //否则 高位是 lastRun
                            else {
                                hn = lastRun;
                                ln = null;
                            }
                            //遍历链表 找到ln 或 hn
                            for (Node<K,V> p = f; p != lastRun; p = p.next) {
                                int ph = p.hash; K pk = p.key; V pv = p.val;
                                if ((ph & n) == 0)
                                    ln = new Node<K,V>(ph, pk, pv, ln);
                                else
                                    hn = new Node<K,V>(ph, pk, pv, hn);
                            }
                            //利用CAS  交换到nextTab 并 将tab[i]  标记为正在扩容
                            setTabAt(nextTab, i, ln);
                            setTabAt(nextTab, i + n, hn);
                            setTabAt(tab, i, fwd);
                            advance = true;
                        }
                        else if (f instanceof TreeBin) {
                            TreeBin<K,V> t = (TreeBin<K,V>)f;
                            TreeNode<K,V> lo = null, loTail = null;
                            TreeNode<K,V> hi = null, hiTail = null;
                            int lc = 0, hc = 0;
                            for (Node<K,V> e = t.first; e != null; e = e.next) {
                                int h = e.hash;
                                TreeNode<K,V> p = new TreeNode<K,V>
                                    (h, e.key, e.val, null, null);
                                if ((h & n) == 0) {
                                    if ((p.prev = loTail) == null)
                                        lo = p;
                                    else
                                        loTail.next = p;
                                    loTail = p;
                                    ++lc;
                                }
                                else {
                                    if ((p.prev = hiTail) == null)
                                        hi = p;
                                    else
                                        hiTail.next = p;
                                    hiTail = p;
                                    ++hc;
                                }
                            }
                            ln = (lc <= UNTREEIFY_THRESHOLD) ? untreeify(lo) :
                                (hc != 0) ? new TreeBin<K,V>(lo) : t;
                            hn = (hc <= UNTREEIFY_THRESHOLD) ? untreeify(hi) :
                                (lc != 0) ? new TreeBin<K,V>(hi) : t;
                            setTabAt(nextTab, i, ln);
                            setTabAt(nextTab, i + n, hn);
                            setTabAt(tab, i, fwd);
                            advance = true;
                        }
                    }
                }
            }
        }
    }

```

 1. 通过计算 CPU 核心数和 Map 数组的长度得到每个线程（CPU）要帮助处理多少个桶，并且这里每个线程处理都是平均的。默认每个线程处理 16 个桶。因此，如果长度是 16 的时候，扩容的时候只会有一个线程扩容。
 2. 初始化临时变量 nextTable。将其在原有基础上扩容两倍。
 3. 死循环开始转移。多线程并发转移就是在这个死循环中，根据一个 finishing 变量来判断，该变量为 true 表示扩容结束，否则继续扩容。

 	3.1 进入一个 while 循环，分配数组中一个桶的区间给线程，默认是 16. 从大到小进行分配。当拿到分配值后，进行 i-- 递减。这个 i 就是数组下标。（其中有一个 bound 参数，这个参数指的是该线程此次可以处理的区间的最小下标，超过这个下标，就需要重新领取区间或者结束扩容，还有一个 advance 参数，该参数指的是是否继续递减转移下一个桶，如果为 true，表示可以继续向后推进，反之，说明还没有处理好当前桶，不能推进)
 	
 	3.2 出 while 循环，进 if 判断，判断扩容是否结束，如果扩容结束，清空临死变量，更新 table 变量，更新库容阈值。如果没完成，但已经无法领取区间（没了），该线程退出该方法，并将 sizeCtl 减一，表示扩容的线程少一个了。如果减完这个数以后，sizeCtl 回归了初始状态，表示没有线程再扩容了，该方法所有的线程扩容结束了。（这里主要是判断扩容任务是否结束，如果结束了就让线程退出该方法，并更新相关变量）。然后检查所有的桶，防止遗漏。

	3.3 如果没有完成任务，且 i 对应的槽位是空，尝试 CAS 插入占位符，让 putVal 方法的线程感知。

	3.4 如果 i 对应的槽位不是空，且有了占位符，那么该线程跳过这个槽位，处理下一个槽位。
	
	3.5 如果以上都是不是，说明这个槽位有一个实际的值。开始同步处理这个桶。

	3.6 到这里，都还没有对桶内数据进行转移，只是计算了下标和处理区间，然后一些完成状态判断。同时，如果对应下标内没有数据或已经被占位了，就跳过了。

 4. 锁住头结点，同步处理
	
	4.1 链表，那么就将这个链表根据 length 取于拆成两份，取于结果是 0 的放在新表的低位，取于结果是 1 放在新表的高位。
	
	4.2 红黑数，那么也拆成 2 份，方式和链表的方式一样，然后，判断拆分过的树的节点数量，如果数量小于等于 6，改造成链表。反之，继续使用红黑树结构。

### 4.小结

 1. 不采用Segment而采用内部类Node作为数组，锁住链表或红黑树的头结点来减小锁粒度
 2. 不允许有 null Key 和 null Value
 3. 扩容时，允许多线程帮助进行扩容，新数组长度为原来的2倍
 4. 大量使用了CAS相关操作，定义了许多特殊的数据结构和变量，比如ForwardingNode和sizeCtl

**参考链接**

 1. [ConcurrentHashMap#transfer() 扩容逐行分析](https://www.jianshu.com/p/2829fe36a8dd)
 2. [为并发而生的 ConcurrentHashMap（Java 8）](https://cnblogs.com/yangming1996/p/8031199.html)
 3. [ConcurrentHashMap原理分析](https://www.cnblogs.com/study-everyday/p/6430462.html#autoid-2-2-6)
