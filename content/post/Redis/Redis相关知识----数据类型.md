---

title:      "Redis相关知识----数据类型"
date:       2021-04-19
author: "shuyou"
categories: ["Code"]
tags:
    - Redis
---

>本文介绍Redis的数据类型相关知识

### Redis数据结构简介
对于Redis，所有的Key都是字符串。我们在谈Redis基础数据结构时，讨论的是存储值的数据类型，主要包括常见的5种数据类型，分别是：String、List、Set、Zset、Hash。

![Redis数据结构](https://img-blog.csdnimg.cn/202104192159585.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
### String字符串
String是redis中最基本的数据类型，一个key对应一个value。String类型是二进制安全的，意思是 redis 的 string 可以包含任何数据。如数字，字符串，jpg图片或者序列化的对象。

**命令**：

|命令| 简述 | 使用 |
|----|----|----|
| GET | 获取存储在给定键中的值 | GET value |
| SET | 设置存储在给定键中的值	 | SET value |
| DEL | 删除存储在给定键中的值	 | DEL value |
| INCR| 将键存储的值加1 | INCR key |
| DECR| 将键存储的值减1 | DECR key |
| INCRBY| 将键存储的值加上整数 | INCRBY key amount |
| DECRBY| 将键存储的值减去整数 | DECRBY key amount |

**使用场景**：

 - 缓存： 经典使用场景，把常用信息，字符串，图片或者视频等信息放到redis中，redis作为缓存层，mysql做持久化层，降低mysql的读写压力。
 - 计数器：redis是单线程模型，一个命令执行完才会执行下一个，同时数据可以一步落地到其他的数据源。
 - session：常见方案spring session + redis实现session共享。

### List列表
Redis中的List其实就是链表（Redis用双端链表实现List）。

**命令**：

|命令| 简述 | 使用 |
|----|----|----|
| RPUSH |将给定值推入到列表右端 | RPUSH key value |
| LPUSH | 将给定值推入到列表左端	 |LPUSH  key value |
| RPOP| 从列表的右端取出一个值 | RPOP key value |
| LPOP| 从列表的左端取出一个值 | LPOP key value |
| LRANGE| 获取列表在给定范围上的所有值 | LRANGE key 0 -1 |
| LINDEX| 通过索引获取列表中的元素 | LINDEX key index |

**使用Redis List的技巧**：

 - LPUSH + RPOP 相当于队列
 - LPUSH + LPOP 相当于栈
 - LPUSH + BRPOP 相当于消息队列

**使用场景**：

 - 微博TimeLine: 有人发布微博，用lpush加入时间轴，展示新的列表信息。
 - 消息队列：可以利用List的 PUSH 操作，将任务存放在List中，然后工作线程再用 POP 操作将任务取出进行执行，相当于生产者消费者模型。

### Set集合
Redis 的 Set 是 String 类型的无序集合。集合成员是唯一的，这就意味着集合中不能出现重复的数据。Redis 中集合是通过哈希表实现的，所以添加，删除，查找的复杂度都是 O(1)。

**命令**：

|命令| 简述 | 使用 |
|----|----|----|
| SADD |向集合添加一个或多个成员 | SADD set-key value |
| SREM |向集合删除一个或多个成员| SREM set-key value |
| SCARD | 获取集合的成员数	 |SCARD set-key|
| SMEMBERS| 返回集合中的所有成员 | SMEMBERS set-key|
| SISMEMBER| 判断 member 元素是否是集合 key 的成员 | SISMEMBER set-key value |

**使用场景**：

 - 标签（tag）,给用户添加标签，或者用户给消息添加标签，这样有同一标签或者类似标签的可以给推荐关注的事或者关注的人。
 - 点赞，或点踩，收藏等，可以放到set中实现

### Hash散列
Redis hash 是一个 string 类型的 field（字段） 和 value（值） 的映射表，hash 特别适合用于存储对象。

**命令**：

|命令| 简述 | 使用 |
|----|----|----|
| HSET|添加键值对 | HSET hash-key sub-key1 value1 |
| HGET| 获取指定散列键的值	 |HGET hash-key sub-key1  |
| HGETALL| 获取散列中包含的所有键值对 | HGETALL hash-key |
| HDEL| 如果给定键存在于散列中，那么就移除这个键 | HDEL hash-key sub-key1|

**使用场景**：

 - 缓存： 能直观，相比string更节省空间，的维护缓存信息，如用户信息，视频信息等。

### Sorted Sets有序集合
Redis 有序集合和集合一样也是 string 类型元素的集合,且不允许重复的成员。不同的是每个元素都会关联一个 double 类型的分数。redis 正是通过分数来为集合中的成员进行从小到大的排序。

有序集合的成员是唯一的,但分数(score)却可以重复。集合是通过哈希表实现的，所以添加，删除，查找的复杂度都是 O(1)。

**命令**：

|命令| 简述 | 使用 |
|----|----|----|
| ZADD|将所有指定成员添加到键为key有序集合（sorted set）里面 | ZADD zset-key score member1|
| ZREM| 如果给定元素成员存在于有序集合中，那么就移除这个元素	 |ZREM zset-key member1 |
| ZRANGE| 返回存储在有序集合key中的指定范围的元素。| ZRANGE zset-key start stop withccores |
| ZCOUNT | 返回有序集key中，score值在min和max之间的成员数。  | ZCOUNT zset-key min max|

**使用场景**：

 - 排行榜：有序集合经典使用场景。例如小说视频等网站需要对用户上传的小说视频做排行榜，榜单可以按照用户关注数，更新时间，字数等打分，做排行。


### HyperLogLogs（基数统计）
什么是基数？

 举个例子，A = {1, 2, 3, 4, 5}， B = {3, 5, 6, 7, 9}；那么基数（不重复的元素）= 1, 2, 4, 6, 7, 9； （允许容错，即可以接受一定误差） 

HyperLogLogs 基数统计用来解决什么问题？ 

这个结构可以非常省内存的去统计各种计数，比如注册 IP 数、每日访问 IP 数、页面实时UV、在线用户数，共同好友数等。

### Bitmap （位存储）
Bitmap 即位图数据结构，都是操作二进制位来进行记录，只有0 和 1 两个状态。

用来解决什么问题？

比如：统计用户信息，活跃，不活跃！ 登录，未登录！ 打卡，不打卡！ 两个状态的，都可以使用 Bitmaps！

**命令**：

|命令| 简述 | 使用 |
|----|----|----|
| SETBIT|对key所储存的字符串值，设置或清除指定偏移量上的位(bit)  | SETBIT bit-key offset value|
| GETBIT| 对 key 所储存的字符串值，获取指定偏移量上的位(bit) |GETBIT bit-key offset |
| BITCOUNT| 被设置为 1 的位的数量| BITCOUNT bit-key |

### geospatial (地理位置)
Redis 的 Geo 可以推算地理位置的信息: 两地之间的距离, 方圆几里的人。


**参考**：

 1. [Redis 5种基础数据类型详解](https://www.pdai.tech/md/db/nosql-redis/db-redis-data-types.html)
 2. [Redis 3种特殊类型详解](https://www.pdai.tech/md/db/nosql-redis/db-redis-data-type-special.html)
