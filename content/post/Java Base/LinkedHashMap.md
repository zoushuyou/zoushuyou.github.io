---
title:      "深入了解LinkedHashMap"
date:       2021-03-16
author: "shuyou"
categories: ["Code"]
tags:
    - Java集合
---

>本文介绍LinkedHashMap的相关知识

### 简介
之前了解过HashMap，HashMap是无序的，当我们希望有顺序地去存储key-value时，就需要使用LinkedHashMap了。

LinkedHashMap由哈希表+双向链表组成，它继承自HashMap，重写了HashMap的一些方法，可以用于LRU算法，它和HashMap一样不是线程安全的。
```java
public class TestLinkedHashMap {
    public static void main(String[] args) {
        LinkedHashMap<String, String> linkedHashMap = new LinkedHashMap<String, String>(16,0.75f,true);
        linkedHashMap.put("name1", "josan1");
        linkedHashMap.put("name2", "josan2");
        linkedHashMap.put("name3", "josan3");
        System.out.println("LinkedHashMap遍历时顺序：");

        for (Entry<String, String> entry : linkedHashMap.entrySet()){
            String key = (String) entry.getKey();
            String value = (String) entry.getValue();
            System.out.println("key:" + key + ",value:" + value);
        }

        HashMap<String, String> hashMap = new HashMap<String, String>(16);
        hashMap.put("name1", "josan1");
        hashMap.put("name2", "josan2");
        hashMap.put("name3", "josan3");
        System.out.println("HashMap遍历时顺序：");

        for (Entry<String, String> entry : hashMap.entrySet()){
            String key = (String) entry.getKey();
            String value = (String) entry.getValue();
            System.out.println("key:" + key + ",value:" + value);
        }

    }
}
```
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210316102945365.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
结果可知，LinkedHashMap是有序的，且默认为插入顺序。

### 构造函数

```java
public class LinkedHashMap<K,V>
    extends HashMap<K,V>
    implements Map<K,V>
{

    public LinkedHashMap() {
        super();
        //accessOrder默认是false，则迭代时输出的顺序是插入节点的顺序。若为true，则输出的顺序是按照访问节点的顺序。
        accessOrder = false;
    }

    public LinkedHashMap(int initialCapacity) {
        super(initialCapacity);
        accessOrder = false;
    }
 	//指定初始化时的容量，和扩容的加载因子
    public LinkedHashMap(int initialCapacity, float loadFactor) {
        super(initialCapacity, loadFactor);
        accessOrder = false;
    }

    public LinkedHashMap(int initialCapacity,
                         float loadFactor,
                         boolean accessOrder) {
        super(initialCapacity, loadFactor);
        this.accessOrder = accessOrder;
    }

    public LinkedHashMap(Map<? extends K, ? extends V> m) {
        super();
        accessOrder = false;
        putMapEntries(m, false);
    }
}
```
**LinkedHashMap 继承了HashMap，实现了Map接口。**

LinkedHashMap的accessOrder变量默认为false，则迭代时输出的顺序是插入节点的顺序。若为true，则输出的顺序是按照访问节点的顺序。

### 数据结构
**Entry的next是用于维护HashMap指定table位置上连接的Entry的顺序的，before、After是用于维护Entry插入的先后顺序的。**

```java
	//LinkedHashMap内部类 Entry继承HashMap的Node内部类，是一个双向链表
    static class Entry<K,V> extends HashMap.Node<K,V> {
        Entry<K,V> before, after;
        Entry(int hash, K key, V value, Node<K,V> next) {
            super(hash, key, value, next);
        }
    }
```
![结构图](https://img-blog.csdnimg.cn/20210316104728801.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70#pic_center)
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210316105558286.jpg?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70#pic_center)
**该循环双向链表的头部存放的是最久访问的节点或最先插入的节点，尾部为最近访问的或最近插入的节点，迭代器遍历方向是从链表的头部开始到链表尾部结束。**

### 增
LinkedHashMap并没有重写任何put方法。但是其重写了构建新节点的newNode()方法.
newNode()会在HashMap的putVal()方法里被调用，putVal()方法会在批量插入数据putMapEntries()或者插入单个数据public V put(K key, V value)时被调用。

LinkedHashMap重写了newNode()，在每次构建新节点时，通过linkNodeLast，将新节点链接在内部双向链表的尾部。

```java
    Node<K,V> newNode(int hash, K key, V value, Node<K,V> e) {
        LinkedHashMap.Entry<K,V> p =
            new LinkedHashMap.Entry<K,V>(hash, key, value, e);
        linkNodeLast(p);
        return p;
    }

    private void linkNodeLast(LinkedHashMap.Entry<K,V> p) {
        LinkedHashMap.Entry<K,V> last = tail;
        //tail 指向尾节点即插入的节点
        tail = p;
        if (last == null)
            head = p;
        else {
            p.before = last;
            last.after = p;
        }
    }
```
**HashMap专门预留给LinkedHashMap的afterNodeAccess() afterNodeInsertion() afterNodeRemoval() 方法。**

```java
    // Callbacks to allow LinkedHashMap post-actions
    void afterNodeAccess(Node<K,V> p) { }
    void afterNodeInsertion(boolean evict) { }
    void afterNodeRemoval(Node<K,V> p) { }
```

```java
    //回调函数，新节点插入之后回调 ， 根据evict 和   判断是否需要删除最老插入的节点。如果实现LruCache会用到这个方法。
    void afterNodeInsertion(boolean evict) { // possibly remove eldest
        LinkedHashMap.Entry<K,V> first;
        //LinkedHashMap 默认返回false 则不删除节点
        if (evict && (first = head) != null && removeEldestEntry(first)) {
            K key = first.key;
            removeNode(hash(key), key, null, false, true);
        }
    }
    //LinkedHashMap 默认返回false 则不删除节点。 返回true 代表要删除最早的节点。通常构建一个LruCache会在达到Cache的上限是返回true
    protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
        return false;
    }
```

### 删
LinkedHashMap也没有重写remove()方法，因为它的删除逻辑和HashMap并无区别。
但它重写了afterNodeRemoval()这个回调方法。该方法会在Node<K,V> removeNode()方法中回调，removeNode()会在所有涉及到删除节点的方法中被调用。

```java
	//双向链表删除节点
    void afterNodeRemoval(Node<K,V> e) { // unlink
        LinkedHashMap.Entry<K,V> p =
            (LinkedHashMap.Entry<K,V>)e, b = p.before, a = p.after;
        //要删除的节点p before和after 置空
        p.before = p.after = null;
        //p的前置节点为null，则p是头节点，head指向p的后置节点
        if (b == null)
            head = a;
        else//b不为null，b的后置节点为p的后置节点
            b.after = a;
        //p的后置节点为null，则p是尾节点，tail指向p的前置节点
        if (a == null)
            tail = b;
        else//a不为null，a的前置节点为p的前置节点
            a.before = b;
    }
```

### 改
更改value时，发生hash冲突，逻辑和HashMap的put逻辑一样。

### 查
重写了HashMap的get方法，调用getNode方法，LinkedHashMap只是增加了在成员变量(构造函数时赋值)accessOrder为true的情况下，要去回调void afterNodeAccess()函数，在afterNodeAccess()函数中，会将当前被访问到的节点e，移动至内部的双向链表的尾部。
```java
    public V get(Object key) {
        Node<K,V> e;
        if ((e = getNode(hash(key), key)) == null)
            return null;
        if (accessOrder)
            afterNodeAccess(e);
        return e.value;
    }

    void afterNodeAccess(Node<K,V> e) { // move node to last
        LinkedHashMap.Entry<K,V> last;//原尾节点
        //如果accessOrder 是true ，且原尾节点不等于e
        if (accessOrder && (last = tail) != e) {
            //节点e强转成双向链表节点p
            LinkedHashMap.Entry<K,V> p =
                (LinkedHashMap.Entry<K,V>)e, b = p.before, a = p.after;
            //p现在是尾节点， 后置节点一定是null
            p.after = null;
            //如果p的前置节点是null，则p以前是头结点，所以更新现在的头结点是p的后置节点a
            if (b == null)
                head = a;
            else//否则更新p的前直接点b的后置节点为 a
                b.after = a;
            //如果p的后置节点不是null，则更新后置节点a的前置节点为b
            if (a != null)
                a.before = b;
            else//如果原本p的后置节点是null，则p就是尾节点。 此时 更新last的引用为 p的前置节点b
                last = b;
            if (last == null) //原本尾节点是null  则，链表中就一个节点
                head = p;
            else {//否则 更新 当前节点p的前置节点为 原尾节点last， last的后置节点是p
                p.before = last;
                last.after = p;
            }
            //尾节点的引用赋值成p
            tail = p;
            //修改modCount。
            ++modCount;
        }
    }
```
### containsValue
LinkedHashMap重写了该方法，相比HashMap的实现，遍历双向链表更为高效。
```java
    public boolean containsValue(Object value) {
        for (LinkedHashMap.Entry<K,V> e = head; e != null; e = e.after) {
            V v = e.value;
            if (v == value || (value != null && value.equals(v)))
                return true;
        }
        return false;
    }
```
对比HashMap，是用两个for循环遍历，相对低效。

```java
    public boolean containsValue(Object value) {
        Node<K,V>[] tab; V v;
        if ((tab = table) != null && size > 0) {
            for (int i = 0; i < tab.length; ++i) {
                for (Node<K,V> e = tab[i]; e != null; e = e.next) {
                    if ((v = e.value) == value ||
                        (value != null && value.equals(v)))
                        return true;
                }
            }
        }
        return false;
    }
```

**总结**

 1. LinkedHashMap通过继承HashMap重写了它的一些方法，实现了有序性。
 2. accessOrder ,默认是false，则迭代时输出的顺序是插入节点的顺序。若为true，则输出的顺序是按照访问节点的顺序。为true时，可以在这基础之上构建一个LRUCache。
 3. LinkedHashMap不是线程安全的，内部结构是哈希表+双向链表。
 4. LinkedHashMap和HashMap一样，允许一对键值为null，key不能重复，但value可以重复。

**参考**

 1. [LinkedHashMap源码解析（JDK8）](https://blog.csdn.net/zxt0601/article/details/77429150)
 2. [图解LinkedHashMap原理](https://www.jianshu.com/p/8f4f58b4b8ab)
 3. [Java集合之LinkedHashMap](https://www.cnblogs.com/xiaoxi/p/6170590.html)
