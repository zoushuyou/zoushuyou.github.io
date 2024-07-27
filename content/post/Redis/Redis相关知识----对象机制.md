---

title:      "Redis相关知识----对象机制"
date:       2021-04-21
author: "shuyou"
categories: ["Code"]
tags:
    - Redis
---

>本文介绍Redis对象机制相关知识，只是对底层做一些了解，并不深入底层的数据结构。


Redis的5种基础数据类型，在底层是采用对象机制实现的。

Redis的每种对象其实都由对象结构(redisObject) 与 对应编码的数据结构组合而成，而每种对象类型对应若干编码方式，不同的编码方式所对应的底层数据结构是不同的。
![Redis对象机制](https://img-blog.csdnimg.cn/20210421170649889.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)

**redisObject**:
redisObject 是 Redis 类型系统的核心, 数据库中的每个键、值, 以及 Redis 本身处理的参数, 都表示为这种数据类型。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210421171948867.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
其中type、encoding和ptr是最重要的三个属性。

 - type记录了对象所保存的值的类型，它的值可能是以下常量中的一个：
```c
/*
 - 对象类型
*/
#define OBJ_STRING 0 // 字符串
#define OBJ_LIST 1 // 列表
#define OBJ_SET 2 // 集合
#define OBJ_ZSET 3 // 有序集
#define OBJ_HASH 4 // 哈希表
```
 - encoding记录了对象所保存的值的编码，它的值可能是以下常量中的一个：

```c
/*
* 对象编码
*/
#define OBJ_ENCODING_RAW 0     /* Raw representation */
#define OBJ_ENCODING_INT 1     /* Encoded as integer */
#define OBJ_ENCODING_HT 2      /* Encoded as hash table */
#define OBJ_ENCODING_ZIPMAP 3  /* 注意：版本2.6后不再使用. */
#define OBJ_ENCODING_LINKEDLIST 4 /* 注意：不再使用了，旧版本2.x中String的底层之一. */
#define OBJ_ENCODING_ZIPLIST 5 /* Encoded as ziplist */
#define OBJ_ENCODING_INTSET 6  /* Encoded as intset */
#define OBJ_ENCODING_SKIPLIST 7  /* Encoded as skiplist */
#define OBJ_ENCODING_EMBSTR 8  /* Embedded sds string encoding */
#define OBJ_ENCODING_QUICKLIST 9 /* Encoded as linked list of ziplists */
#define OBJ_ENCODING_STREAM 10 /* Encoded as a radix tree of listpacks */

```

 - ptr是一个指针，指向实际保存值的数据结构，这个数据结构由type和encoding属性决定。如果一个redisObject 的type 属性为OBJ_LIST ， encoding 属性为OBJ_ENCODING_QUICKLIST ，那么这个对象就是一个Redis 列表（List)，它的值保存在一个QuickList的数据结构内，而ptr 指针就指向quicklist的对象；

**当执行一个处理数据类型命令的时候，redis执行以下步骤**：

 - 根据给定的key，在数据库字典中查找和他相对应的redisObject，如果没找到，就返回NULL；
 - 检查redisObject的type属性和执行命令所需的类型是否相符，如果不相符，返回类型错误；
 - 根据redisObject的encoding属性所指定的编码，选择合适的操作函数来处理底层的数据结构；
 - 返回数据结构的操作结果作为命令的返回值。

比如现在执行LPOP命令：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210421173348258.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)

**字符串对象**：
从第一张图可以看出字符串对象的编码类型：

 - int 编码：保存的是可以用 long 类型表示的整数值。 
 - embstr 编码：保存长度小于44字节的字符串（redis3.2版本之前是39字节，之后是44字节）。 
 - raw 编码：保存长度大于44字节的字符串（redis3.2版本之前是39字节，之后是44字节）。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210421184642144.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)


**列表对象**：

列表对象的编码是quicklist。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210421184628366.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**哈希对象**：
哈希对象的编码可以是 ziplist 或者 hashtable；对应的底层实现有两种, 一种是ziplist, 一种是dict。
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021042118473249.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)


**集合对象**：
集合对象的编码可以是 intset 或者 hashtable; 底层实现有两种, 分别是intset和dict。 显然当使用intset作为底层实现的数据结构时, 集合中存储的只能是数值数据, 且必须是整数; 而当使用dict作为集合对象的底层实现时, 是将数据全部存储于dict的键中, 值字段闲置不用。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210421185640615.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**有序集合对象**：
有序集合的底层实现依然有两种, 一种是使用ziplist作为底层实现, 另外一种比较特殊, 底层使用了两种数据结构: dict与skiplis。
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021042119004922.png)
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210421190111616.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
其实有序集合单独使用字典或跳跃表其中一种数据结构都可以实现，但是这里使用两种数据结构组合起来，原因是假如我们单独使用 字典，虽然能以 O(1) 的时间复杂度查找成员的分值，但是因为字典是以无序的方式来保存集合元素，所以每次进行范围操作的时候都要进行排序；假如我们单独使用跳跃表来实现，虽然能执行范围操作，但是查找操作有 O(1)的复杂度变为了O(logN)。因此Redis使用了两种数据结构来共同实现有序集合。

**参考**：

 1. [redis对象与编码(底层结构)对应关系详解](https://www.pdai.tech/md/db/nosql-redis/db-redis-data-type-enc.html#%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%AF%B9%E8%B1%A1)
