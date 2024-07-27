---
title:      "Java集合小结"
date:       2021-02-23
author: "shuyou"
categories: ["Code"]
tags:
    - Java集合
---
>这篇文章对Java集合相关类进行介绍，包括Collection、List、Set、Map、Queue这些常见得集合相关接口和类。

### 1.集合概述
常用的集合有List、Set、Map、Queue等，他们之间的关系如下图。List、Queue、Set继承Collection接口。Iterable接口是迭代器，这里不进行过多介绍。Map接口是一个单独的接口，这里不进行介绍。
![关系图](https://img-blog.csdnimg.cn/20210223141021909.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**List、Set、Queue、Map的区别**
- List存储可以重复、有序的元素
- Set存储不可以重复、无序的元素
- Queue存储有序的元素且先进先出，是一个队列
- Map是键值对存储结构，Key 是无序的、不可重复的，value 是无序的、可重复的，每个键最多映射到一个值，key和value都可以为null

### 2.List

**List：元素有序，元素可重复，添加的元素放在最后（按照插入顺序保存元素）**

常用子类有：

 - ArrayList
 - LinkedList
 - Vector

**2.1 ArrayList**
![arraylist继承图](https://img-blog.csdnimg.cn/202102231429137.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
ArrayList继承AbstractList抽象类，实现List、Serializable、Cloneable、RandomAccess接口。
**使用 Object[] 数组存储元素** 因此查询快，增删操作慢，没有实现线程同步。

常用方法：
 - add(E e) 向数组末尾添加一个元素
 - clear() 清除所有元素，数组里的元素为null，size置为0
 - contains(Object o)  是否包含某个元素
 - get(int index) 获取第i个元素
 - remove(int index) 删除第i个元素
 - remove(Object o) 删除某个元素
 - size() 返回存储了多少个元素

**2.2 LinkedList**
![LinkedList继承图](https://img-blog.csdnimg.cn/20210223144522217.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
LinkedList继承AbstractSequentialList抽象类，实现List、Serializable、Cloneable、Deque接口。
**使用双向链表存储元素（内有Node私有静态内部类）** 因此查询慢，增删操作快，没有实现线程同步。
![双向链表](https://img-blog.csdnimg.cn/20210223144842742.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
因为实现了Deque接口，所以除了拥有列表相关的常用方法外，还有队列相关的方法。

**实现List接口的方法（列表相关操作）常用方法和ArrayList类似**
![列表相关操作](https://img-blog.csdnimg.cn/20210223145208747.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**实现Deque接口的方法（队列相关操作）**
![队列相关操作](https://img-blog.csdnimg.cn/20210223150655944.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)


 - addFirst(E e)  offerFirst(E e)  插入链表首位
 - addLast(E e)  offerLast(E e)  插入链表末尾
 - getFirst()  element()   获取链表首位元素
 - getLast()  获取链表末尾元素
 - offer(E e)  链表末尾添加元素
 - peek()  peekFirst()  获取链表首位元素 但不删除
 - poll()  pollFirst()  获取链表首位元素 且删除

**2.3 Vector**
![Vector继承](https://img-blog.csdnimg.cn/20210223151148644.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**使用 Object[] 数组存储元素** 因此查询快，增删操作慢，实现线程同步。
Vector非常类似ArrayList，但是Vector是同步的。由Vector创建的Iterator，虽然和 ArrayList创建的Iterator是同一接口，但是，因为Vector是同步的，当一个Iterator被创建而且正在被使用，另一个线程改变了 Vector的状态（例如，添加或删除了一些元素），这时调用Iterator的方法时将抛出 ConcurrentModificationException。

### 3.Set
**Set：元素无序，元素不可重复。**
 - 无序性不等于随机性 ，无序性是指存储的数据在底层数组中并非按照数组索引的顺序添加 ，而是根据数据的哈希值决定的。
 - 不可重复性是指添加的元素按照 equals()判断时 ，返回 false，需要同时重写 equals()方法和 HashCode()方法。

常用子类：

 - HashSet
 - LinkedHashSet
 - TreeSet

**3.1 HashSet**
使用HashMap来保存所有元素，线程不安全的，集合元素可以是null,但只能放入一个null，不能保证迭代的顺序与插入的顺序一致。

**当使用add方法添加元素时，底层是使用HashMap的put方法，会计算key的hash值，以hashcode值不同来去除重复的值，值得注意的是当添加对象作为键时，应该重写对象类的hashCode()和equals()方法**
如果自定义的类中没有重写equals()，那么比较的还是地址，返回值不同，则判断为两个对象不相等，都被添加到了集合中，所以也要重写equals()。
所以自定义对象添加到Set集合类中一定要重写hashCode()与equals()，缺一不可 。

**3.2 LinkedHashSet**
使用LinkedHashMap来保存所有元素，线程不安全的，集合元素不能重复，迭代输出的顺序与插入的顺序保持一致。
**继承HashSet**

**3.3 TreeSet**
TreeSet 是 SortedSet 接口的实现类，TreeSet 可以确保集合元素处于排序状态。TreeSet底层使用红黑树结构存储数据(使用TreeMap存储元素)，默认情况下，TreeSet 采用自然排序。
向TreeSet中添加的数据，要求是相同类的对象，需要实现使用至少一种排序方式，Comparable（自然排序）和Comparator（定制排序）。比较两个对象是否相同的标准是重写的方法是否返回0，不再equals()。

### 4.Queue
队列通常但不一定以FIFO（先进先出）的方式对元素进行排序。 例外情况包括优先级队列（根据提供的比较器对元素进行排序或元素的自然排序）和LIFO队列（或堆栈），对LIFO进行排序（后进先出）。

很多常用queue子类都与线程有关，LinkedList已经介绍过了，这里只介绍ArrayDeque。

**Deque**
Deque扩展了Queue，有队列的所有方法，还可以看做栈，有栈的基本方法push/pop/peek，还有明确的操作两端的方法如addFirst/removeLast等。

![方法](https://img-blog.csdnimg.cn/20210223172655847.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)


该接口定义了访问双端队列两端的元素的方法。 提供了用于插入，删除和检查元素的方法。 这些方法中的每一种都以两种形式存在：一种在操作失败时引发异常，另一种返回一个特殊值（取决于操作，为null或false ）。 插入操作的后一种形式是专门为容量受限的Deque实现而设计的。 在大多数实现中，插入操作不会失败。

**4.1 ArrayDeque**
ArrayDeque实现了Deque接口，同LinkedList一样，它的队列长度也是没有限制的，底层使用 Object[] 数组存储元素
![方法](https://img-blog.csdnimg.cn/20210223172604231.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)

 - ArrayDeque 是一个可扩容的数组，LinkedList 是链表结构；
 - ArrayDeque 里不可以存 null 值，但是 LinkedList 可以；
 - ArrayDeque 在操作头尾端的增删操作时更高效，但是 LinkedList 只有在当要移除中间某个元素且已经找到了这个元素后的移除才是 O(1) 的；因为ArrayDeque底层使用的是一个逻辑循环数组
 - ArrayDeque 在内存使用方面更高效。

**推荐使用ArrayDeque**

### 5.Map接口
Map接口与List、Set接口不同，它并未继承Collection接口，是由一系列键值对组成的接口，是一个独立的接口。常用的实现Map的类有HashMap、ConcurrentHashMap、HashTable、TreeMap。

Map接口有一个内部接口Entry，它是存储元素键值对的条目。


##### 5.1HashMap和HashTable的区别

 - 线程安全：HashMap不是线程安全的，HashTable是线程安全的，它通过使用synchonrized修饰方法保证线程安全
 - 效率：HashMap比HashTable效率高，如果为了保证线程安全推荐使用ConcurrentHashMap，不推荐使用HashTable
 - 对 Null key 和 Null value 的支持： HashMap 可以存储 null 的 key 和 value，但 null 作为键只能有一个，null 作为值可以有多个；HashTable 不允许有 null 键和 null 值，否则会抛出 NullPointerException。
 - 初始容量大小和每次扩充容量大小的不同 ： ① 创建时如果不指定容量初始值，Hashtable 默认的初始大小为 11，之后每次扩充，容量变为原来的 2n+1。HashMap 默认的初始化大小为 16。之后每次扩充，容量变为原来的 2 倍。② 创建时如果给定了容量初始值，那么 Hashtable 会直接使用你给定的大小，而 HashMap 会将其扩充为 2 的幂次方大小（HashMap 中的tableSizeFor()方法保证，下面给出了源代码）。也就是说 HashMap 总是使用 2 的幂作为哈希表的大小,后面会介绍到为什么是 2 的幂次方。
 - 底层数据结构： JDK1.8 以后的 HashMap 在解决哈希冲突时有了较大的变化，当链表长度大于阈值（默认为 8）（将链表转换成红黑树前会判断，如果当前数组的长度小于 64，那么会选择先进行数组扩容，而不是转换为红黑树）时，将链表转化为红黑树，以减少搜索时间。Hashtable 没有这样的机制。

##### 5.2HashMap的底层实现
jdk1.8以前，HashMap底层使用数组加链表的方式实现，也称链表散列。HashMap通过key的hashCode经过hash()函数处理后得到hash值，然后通过（n - 1）& hash 判断当前元素存放的位置（这里的 n 指的是数组的长度），如果当前位置存在元素的话，就判断该元素与要存入的元素的 hash 值以及 key 是否相同，如果相同的话，直接覆盖，不相同就通过拉链法解决冲突。

[hash函数详解](https://www.hollischuang.com/archives/2091)

为了能让 HashMap 存取高效，尽量较少碰撞，也就是要尽量把数据分配均匀。我们上面也讲到了过了，Hash 值的范围值-2147483648 到 2147483647，前后加起来大概 40 亿的映射空间，只要哈希函数映射得比较均匀松散，一般应用是很难出现碰撞的。但问题是一个 40 亿长度的数组，内存是放不下的。所以这个散列值是不能直接拿来用的。用之前还要先做对数组的长度取模运算，得到的余数才能用来要存放的位置也就是对应的数组下标。这个数组下标的计算方法是“ (n - 1) & hash”。（n 代表数组长度）。这也就解释了 HashMap 的长度为什么是 2 的幂次方。

这个算法应该如何设计呢？

我们首先可能会想到采用%取余的操作来实现。但是，重点来了：“取余(%)操作中如果除数是 2 的幂次则等价于与其除数减一的与(&)操作（也就是说 hash%length==hash&(length-1)的前提是 length 是 2 的 n 次方；）。” 并且 采用二进制位操作 &，相对于%能够提高运算效率，这就解释了 HashMap 的长度为什么是 2 的幂次方。

##### 5.3ConcurrentHashMap 和 Hashtable 的区别

 - 底层数据结构：ConcurrentHashMap在jdk1.7之前使用 分段数组+链表 实现，jdk1.8采用同HashMap一样的 数组 + 链表/红黑树。Hashtable 和 JDK1.8 之前的 HashMap 的底层数据结构类似都是采用 数组+链表 的形式。
 - 实现线程安全的方式：ConcurrentHashMap在jdk1.7之前使用分段数组segment 加锁实现，每一把锁只锁容器其中一部分数据，多线程访问容器里不同数据段的数据，就不会存在锁竞争，提高并发访问率。jdk1.8 采用了粒度更小的方式，直接对Node采用 volatile 关键字修饰，方法则用synchronized和CAS进行并发控制。