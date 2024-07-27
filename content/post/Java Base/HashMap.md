---
title:      "深入了解HashMap"
date: 2021-03-02
author: "shuyou"
categories: ["Code"]
tags:
    - Java集合
---
>本篇分析HashMap的 hash()函数 和 底层数据结构 以及 常用方法 和 常见面试相关题目

### 1. HashMap简介
HashMap 是一个K，V键值对的常用集合类，它实现了Map接口。
jdk1.8 之前 HashMap 采用 数组 + 链表 的方式实现，链表存储key值冲突的数据。
jdk1.8 采用  数组 + 链表 / 红黑树 的方式实现，在满足下面两个条件之后，会执行链表转红黑树操作，以此来加快搜索速度。

 - 链表长度大于阈值（默认为 8）
 - HashMap 数组长度超过 64

### 2. HashMap底层数据结构
**类的属性**

```java
public class HashMap<K,V> extends AbstractMap<K,V> implements Map<K,V>, Cloneable, Serializable {

    // 默认的初始容量是16
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;
    // 最大容量
    static final int MAXIMUM_CAPACITY = 1 << 30;
    // 默认的填充因子
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    // 当桶(bucket)上的结点数大于这个值时会转成红黑树
    static final int TREEIFY_THRESHOLD = 8;
    // 当桶(bucket)上的结点数小于这个值时树转链表
    static final int UNTREEIFY_THRESHOLD = 6;
    // 桶中结构转化为红黑树对应的table的最小大小
    static final int MIN_TREEIFY_CAPACITY = 64;
    // 存储元素的数组，大小总是2的幂次倍
    transient Node<k,v>[] table;
    // 存放具体元素的集
    transient Set<map.entry<k,v>> entrySet;
    // 存放元素的个数，注意这个不等于数组的长度。
    transient int size;
    // 每次扩容和更改map结构的计数器
    transient int modCount;
    // 临界值 当实际大小(容量*填充因子)超过临界值时，会进行扩容
    int threshold;
    // 加载因子
    final float loadFactor;
}
```
**一些内部类**

 - EntrySet、EntryIterator、EntrySpliterator			键值Set 迭代器 分离器s
 - KeySet、KeyIterator、KeySpliterator					键Set   迭代器 分离器
 - Values、ValueIterator、ValueSpliterator			值Set   迭代器 分离器

*使用*

```java
public class TestMap {
    public static void main(String[] args) {
        
        HashMap<String, String> test =  new HashMap<>();
        System.out.println(test.size());
        test.put("A","AAA");
        test.put("B","BBB");
        test.put("C","CCC");
        test.put("D","DDD");
        test.put("E","EEE");

        Iterator<Map.Entry<String, String>> iterator = test.entrySet().iterator();
        while (iterator.hasNext()){
            System.out.println(iterator.next());
        }

        Iterator<String> iterator1 = test.keySet().iterator();
        while (iterator1.hasNext()){
            System.out.println(iterator1.next());
        }

        Spliterator<String> spliterator = test.values().spliterator();

        System.out.println(spliterator.estimateSize());
        spliterator.forEachRemaining(System.out::println);

        System.out.println(test.size());
    }
}
```
![结果](https://img-blog.csdnimg.cn/20210301172916936.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)


**Node节点类**

```java
    static class Node<K, V> implements Entry<K, V> {
        final int hash; //hash值，存放元素时用来与其他元素的hash值进行比较。
        final K key; // 键  key 唯一  一个key 一个 value  允许有一个 key为 null 
        V value; // 值
        HashMap.Node<K, V> next; //指向下一个Node

        Node(int var1, K var2, V var3, HashMap.Node<K, V> var4) {
            this.hash = var1;
            this.key = var2;
            this.value = var3;
            this.next = var4;
        }

        public final K getKey() {
            return this.key;
        }

        public final V getValue() {
            return this.value;
        }

        public final String toString() {
            return this.key + "=" + this.value;
        }
		
        public final int hashCode() {
            return Objects.hashCode(this.key) ^ Objects.hashCode(this.value);
        }

        public final V setValue(V var1) {
            Object var2 = this.value;
            this.value = var1;
            return var2;
        }

        public final boolean equals(Object var1) {
            if (var1 == this) {
                return true;
            } else {
                if (var1 instanceof Entry) {
                    Entry var2 = (Entry)var1;
                    if (Objects.equals(this.key, var2.getKey()) && Objects.equals(this.value, var2.getValue())) {
                        return true;
                    }
                }

                return false;
            }
        }
    }
```

**TreeNode源码**

```java
    // 一些方法这里就不贴了
    static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
        TreeNode<K,V> parent;  // 红黑树 父节点
        TreeNode<K,V> left;
        TreeNode<K,V> right;
        TreeNode<K,V> prev;    // 删除后需要取消链接
        boolean red;
        TreeNode(int hash, K key, V val, Node<K,V> next) {
            super(hash, key, val, next);
        }
    }
```

**数组+链表**
Node<k,v>[] table  
![拉链](https://img-blog.csdnimg.cn/20210301175245123.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**数组+红黑树**
![\[](https://img-blog.csdnimg.cn/2021030117571543.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
### 3.HashMap常用方法
**构造函数**

```java
    /**
     * 构造一个具有指定初始容量和负载因子的空HashMap 。
     */
    public HashMap(int initialCapacity, float loadFactor) {
      //如果初始化大小小于0，抛出异常  
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal initial capacity: " +
                                               initialCapacity);
      //HashMap 中table的最大值为2^30 如果初始化大小大于2^30，则为2^30
        if (initialCapacity > MAXIMUM_CAPACITY)
            initialCapacity = MAXIMUM_CAPACITY;
            
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException("Illegal load factor: " +
                                               loadFactor);
        this.loadFactor = loadFactor;
        this.threshold = tableSizeFor(initialCapacity);
    }

    /**
     * 自定义初始容量  使用默认加载因子（0.75）构造一个空的HashMap 。
     */
    public HashMap(int initialCapacity) {
        this(initialCapacity, DEFAULT_LOAD_FACTOR);
    }

    /**
     * 使用默认的初始容量（16）和默认的加载因子（0.75）构造一个空的HashMap 。
     */
    public HashMap() {
        this.loadFactor = DEFAULT_LOAD_FACTOR; // all other fields defaulted
    }
```

 - 填装因子:loadFactor 表示填装因子的大小，简单的介绍一下填装因子：假设数组大小为16，每个放到数组中的元素mod 9，所有元素取模后放的位置是（0–9） 此时填装因子的大小为 9/16 ,装填因子就为0.75啦。
 
 - HashMap初始化过程就是新建一个大小为capacity，类型为Node的数组，Node上面已经介绍过这个类，包含一个指针一个key，一个value，和一个hash。capacity是2的次幂，至于为什么是2的次幂后面会有介绍的。

**hash函数**

```java
    static final int hash(Object key) {
        int h;
        //用 key 的 hashCode  高16位 与 低16位 进行 异或运算 结果放在低16位
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }
```
因为hashmap的 put 和 get 都要将 key 经过hash函数处理之后 与 数组大小 length -1 进行与运算，而数组的大小通常不会超过2^16，所以始终是低16位参与运算，所以将key的hashCode的高16位与低16位进行异或运算，得到的值会更具有散列的特性。

**put 函数**

```java
    public V put(K key, V value) {
        return putVal(hash(key), key, value, false, true);
    }
    
    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        //table未初始化 或者 长度为 0 进行扩容 
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        // 确定存放的下标，如果此时为null，则新生Node 放入当前数组下标的位置。
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
     	//数组当前位置已存在元素
        else {
            Node<K,V> e; K k;
            //数组当前位置p 的hash 与要插入元素的hash相等 且 key 相等
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                //当前位置p 赋值给 e
                e = p;
            // hash值不等，即key不等，p为红黑树节点
            else if (p instanceof TreeNode)
            	//插入红黑树
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            //为链表节点
            else {
            	//在链表节点最末端插入
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                    	//插入最末端
                        p.next = newNode(hash, key, value, null);
                        //结点数量达到阈值(默认为 8 )，执行 treeifyBin 方法
                        // 这个方法会根据 HashMap 数组来决定是否转换为红黑树。
                    	// 只有当数组长度大于或者等于 64 的情况下，才会执行转换红黑树操作，否则就是只是对数组扩容。
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    //找到了key 值一样的节点 跳出循环 修改value
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            // 找到key值、hash值与插入元素相等的结点
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                	//修改旧值
                    e.value = value;
                afterNodeAccess(e);
                //返回旧值
                return oldValue;
            }
        }
        //结构性修改
        ++modCount;
        // 实际大小大于阈值则扩容
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210302131218700.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)

 1. 先判断数组 table 是否为null 或者 长度为0，如果是则 resize() 扩容，否则根据 hash 确定存放的下标，如果此时数组对应位置为null，则新生Node 放入当前数组下标的位置。
 2. 对应位置有值，判断key是否一致，一致则直接修改value值 ，否则进行遍历在末端插入。
 3. 判断此时链表长度是否大于默认阈值（8），不大于则直接返回旧值，否则将链表转换为红黑树。

**get函数**

```java
    public V get(Object key) {
        Node<K,V> e;
        return (e = getNode(hash(key), key)) == null ? null : e.value;
    }
    
    final Node<K,V> getNode(int hash, Object key) {
        Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
        if ((tab = table) != null && (n = tab.length) > 0 &&
            (first = tab[(n - 1) & hash]) != null) { // hash计算出的 数组位置 第一个元素存在
            if (first.hash == hash && // 数组当位置的第一个元素 hash 与要取的 hash相当 且 key相等
                ((k = first.key) == key || (key != null && key.equals(k))))
                return first;
            if ((e = first.next) != null) { // 存在第二个元素
                if (first instanceof TreeNode) // 第一个元素是一个树节点 调红黑树的取值方法
                    return ((TreeNode<K,V>)first).getTreeNode(hash, key);
                do {// 链表节点  循环遍历  找到节点相等的key 和 hash
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        return e;
                } while ((e = e.next) != null);
            }
        }
        // 没有  返回null
        return null;
    }
```
**扩容**
什么时候进行扩容操作？

 1. 数组 table 为null 或者长度为 0
 2. 数组中元素实际个数大于阈值 threshold 会扩容
 3. 链表中的长度超过了TREEIFY_THRESHOLD（8），但表长度却小于MIN_TREEIFY_CAPACITY（64）

```java
    final Node<K,V>[] resize() {
        Node<K,V>[] oldTab = table;
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        int oldThr = threshold;
        int newCap, newThr = 0;
        //旧容量大于 0 
        if (oldCap > 0) {
        	//旧容量大于等于最大容量 阈值等于最大容量 并返回旧容量值
            if (oldCap >= MAXIMUM_CAPACITY) {
                threshold = Integer.MAX_VALUE;
                return oldTab;
            }
            //新容量 为 旧容量的2倍 且 旧容量大于默认初始化容量且小于最大容量
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)
                newThr = oldThr << 1; // 新阈值为 旧阈值的2倍
        }
        else if (oldThr > 0) //旧容量小于等于0时 新容量 等于 旧阈值
            newCap = oldThr;
        else {               // 阈值和容量 都初始化为默认值
            newCap = DEFAULT_INITIAL_CAPACITY;
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
        }
        if (newThr == 0) {
            float ft = (float)newCap * loadFactor;
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        threshold = newThr;
        @SuppressWarnings({"rawtypes","unchecked"})
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
        table = newTab;
        if (oldTab != null) {
        	//遍历旧数组 oldTab
            for (int j = 0; j < oldCap; ++j) {
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                	//旧数组 j 位置置空
                    oldTab[j] = null;
                    //只有一个值，根据hash放入新数组的对应位置
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    //为红黑树 
                    else if (e instanceof TreeNode)
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // 链表优化重hash的节点
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        do {
                            next = e.next;
                            //原索引
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                            //原索引 + oldCap
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                         // 原索引放到新数组 j 上
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        // 原索引+oldCap放到新数组 j+oldCap 上
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
        }
        return newTab;
    }
```
### 小结

 1. 扩容是一个特别耗性能的操作，所以当使用HashMap的时候，估算map的大小，初始化的时候给一个大致的数值，避免map进行频繁的扩容。
 2. 负载因子是可以修改的，也可以大于1，但是不建议轻易修改。
 3. HashMap不是线程安全的，不要在并发环境下同时操作HashMap，建设使用ConcurrentHashMap。
 4. JDK1.8之前 HashMap是数组+链表的实现，JDK1.8采用数组+链表/红黑树的方式实现。


### 4.常见面试题
**1.HashMap的底层数据结构**
JDK1.8之前    	数组+链表
JDK1.8之后		数组+链表/红黑树

**2.HashMap的工作原理**
HashMap底层是数组+链表，由Node内部类实现，通过put方法存放、get方法获取数据。

存储数据时，将K，V键值传给put方法

 1. 调用hash(K)方法，计算K的hash值，hash&(n-1)计算此时应放的数组下标。
 2. 判断当前数组位置是否有值，没有则直接插入，有值则判断他们的key是否相等，相等则修改它的值。
 3. 否则，判断当前节点是红黑树还是链表，若是链表则遍历，在末端插入元素，若存在key相等的节点，则修改它的值，若是红黑树则遍历红黑树并插入元素
 4. 判断插入链表后，链表的长度是否大于8，如果大于且数组长度大于64，则链表转为红黑树，数组长度小于64，则数组扩容。
 5. 判断插入之后，HashMap实际元素的个数是否大于 capacity * loadfactor，大于会进行扩容。

获取数据时，将K值传给get方法。

 1. 调用 hash(K) 方法（计算 K 的 hash 值）从而获取该键值所在链表的数组下标
 2. 遍历链表或者红黑树，equals()方法查找相同 Node 链表中 K 值对应的 V 值。

 **3.HashMap 的底层数组长度为何总是2的n次方**

1. 数据分布均匀，减少hash碰撞
2. 当长度n总是2的n次方时  hash&（n-1）相当于 hash%n-1，即相当于取模运算，而且在速度、效率上比直接取模要快得多

**4.HashMap允许空键空值么**
HashMap允许Key有一个为null，允许多个Value为null

**5.HashMap线程安全方面会出现什么问题**
JDK1.7   扩容会出现循环链或数据丢失
JDK1.8   put会出现数据覆盖


**参考链接**

 1. [美团技术团队 Java 8系列之重新认识HashMap](https://tech.meituan.com/2016/06/24/java-hashmap.html)
 2. [JavaGuide HashMap(JDK1.8)源码+底层数据结构分析](https://github.com/Snailclimb/JavaGuide/blob/master/docs/java/collection/HashMap%28JDK1.8%29%E6%BA%90%E7%A0%81+%E5%BA%95%E5%B1%82%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E5%88%86%E6%9E%90.md)
 3. [HashMap 常见面试题](https://www.cnblogs.com/java1024/p/13488714.html)

