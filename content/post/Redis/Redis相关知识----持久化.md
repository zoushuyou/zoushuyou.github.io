---

title:      "Redis相关知识----持久化（RDB和AOF）"
date:       2021-04-23
author: "shuyou"
categories: ["Code"]
tags:
    - Redis
---

>本文介绍Redis的持久化相关知识

### 简介
Redis是基于内存的数据库，服务器一旦宕机，内存中的数据将全部丢失。

通常的解决方案是从后端数据库恢复这些数据，但后端数据库有性能瓶颈，如果是大数据量的恢复，1、会对数据库带来巨大的压力，2、数据库的性能不如Redis。导致程序响应慢。

所以对Redis来说，实现数据的持久化，避免从后端数据库中恢复数据，是至关重要的。

Redis提供RDB和AOF持久化解决方案。

### RDB持久化
**RDB**：Redis DataBase，中文叫快照（内存快照）。RDB持久化就是进程中的数据保存到磁盘上的过程（生成rdb文件），由于是某一时刻的快照，那么快照中的值要早于或者等于内存中的值。

**手动触发RDB持久化**：

 - save命令：阻塞当前Redis服务器，直到RDB过程完成为止，对于内存 比较大的实例会造成长时间阻塞，线上环境不建议使用。
 - bgsave命令：Redis进程执行fork操作创建子进程，RDB持久化过程由子 进程负责，完成后自动结束。阻塞只发生在fork阶段，一般时间很短。


**自动触发RDB持久化**：

 - redis.conf中配置save m n，即在m秒内有n次修改时，自动触发bgsave生成rdb文件；
 - 主从复制时，从节点要从主节点进行全量复制时也会触发bgsave操作，生成当时的快照发送到从节点；
 - 执行debug reload命令重新加载redis时也会触发bgsave操作；
 - 默认情况下执行shutdown命令时，如果没有开启aof持久化，那么也会触发bgsave操作；

redis.conf中RDB相关配置：

```yaml
# 周期性执行条件的设置格式为
save <seconds> <changes>

# 默认的设置为：
save 900 1
save 300 10
save 60 10000

# 以下设置方式为关闭RDB快照功能
save ""

# 文件名称
dbfilename dump.rdb

# 文件保存路径
dir /home/work/app/redis/data/

# 如果持久化出错，主进程是否停止写入
stop-writes-on-bgsave-error yes

# 是否压缩
rdbcompression yes

# 导入时是否检查
rdbchecksum yes
```

**主线程在保证写操作的情况下，RDB如何保证数据一致性？**

RDB中的核心思路是Copy-on-Write，来保证在进行快照操作的这段时间，需要压缩写入磁盘上的数据在内存中不会发生变化。

 - 在正常的快照操作中，一方面Redis主进程会fork一个新的快照进程专门来做这个事情，这样保证了Redis服务不会停止对客户端包括写请求在内的任何响应。
 - 另一方面这段时间发生的数据变化会以副本的方式存放在另一个新的内存区域，待快照操作结束后才会同步到原来的内存区域。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210423162301933.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**进行RDB持久化过程中，服务器宕机怎么办？**

如果出现服务器崩溃的情况，会以上一次完整的RDB快照文件作为恢复内存数据的参考。也就是说，在快照操作过程中不能影响上一次的备份数据。

Redis服务会在磁盘上创建一个临时文件进行数据操作，待操作成功后才会用这个临时文件替换掉上一次的备份。

**可以每秒做一次快照吗？**

不行。

虽然越短时间做一次快照，可以保证当服务器宕机时数据丢失越少。但是如果频繁地执行全量快照，也会带来其他开销。

 - 频繁将全量数据写入磁盘，会给磁盘带来很大压力，多个快照竞争有限的磁盘带宽，前一个快照还没有做完，后一个又开始做了，容易造成恶性循环。
 - bgsave 子进程需要通过 fork 操作从主线程创建出来。虽然，子进程在创建后不会再阻塞主线程，但是，fork 这个创建过程本身会阻塞主线程，而且主线程的内存越大，阻塞时间越长。如果频繁 fork 出 bgsave 子进程，这就会频繁阻塞主线程了。

**RDB优缺点**：

优点：
 - RDB文件是某个时间节点的快照，默认使用LZF算法进行压缩，压缩后的文件体积远远小于内存大小，适用于备份、全量复制等场景；
 - Redis加载RDB文件恢复数据要远远快于AOF方式；

缺点：

 - RDB方式实时性不够，无法做到秒级的持久化；
 - 每次调用bgsave都需要fork子进程，fork子进程属于重量级操作，频繁执行成本较高；
 - RDB文件是二进制的，没有可读性，AOF文件在了解其结构的情况下可以手动修改或者补全；

### AOF持久化
针对RDB不适合实时持久化的问题，Redis提供了AOF持久化方式来解决。

与Mysql不同（大多数的数据库采用的是写前日志（WAL），例如MySQL，通过写前日志和两阶段提交，实现数据和逻辑的一致性。），Redis是“写后”日志，Redis先执行命令，把数据写入内存，然后才记录日志。日志里记录的是Redis收到的每一条命令，这些命令是以文本形式保存。


**如何实现AOF**
AOF日志记录Redis的每个写命令，步骤分为：命令追加（append）、文件写入（write）和文件同步（sync）。

 - **命令追加** 当AOF持久化功能打开了，服务器在执行完一个写命令之后，会以协议格式将被执行的写命令追加到服务器的 aof_buf 缓冲区。
 - **文件写入和同步** 关于何时将 aof_buf 缓冲区的内容写入AOF文件中，Redis提供了三种写回策略：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210423170738841.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)

**redis.conf中配置AOF**

```yaml
#默认情况下，Redis是没有开启AOF的，可以通过配置redis.conf文件来开启AOF持久化，关于AOF的配置如下：

# appendonly参数开启AOF持久化
appendonly no

# AOF持久化的文件名，默认是appendonly.aof
appendfilename "appendonly.aof"

# AOF文件的保存位置和RDB文件的位置相同，都是通过dir参数设置的
dir ./

# 同步策略
# appendfsync always
appendfsync everysec
# appendfsync no

# aof重写期间是否同步
no-appendfsync-on-rewrite no

# 重写触发配置
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# 加载aof出错如何处理
aof-load-truncated yes

# 文件重写策略
aof-rewrite-incremental-fsync yes

```

**AOF重写机制**

AOF会记录每个写命令到AOF文件，随着时间越来越长，AOF文件会变得越来越大。如果不加以控制，会对Redis服务器，甚至对操作系统造成影响，而且AOF文件越大，数据恢复也越慢。

为了解决AOF文件体积膨胀的问题，Redis提供AOF文件重写机制来对AOF文件进行“瘦身”。

**AOF重写**
Redis通过创建一个新的AOF文件来替换现有的AOF，新旧两个AOF文件保存的数据相同，但新AOF文件没有了冗余命令。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210423174921907.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**AOF重写会阻塞吗？**
fork子进程的时候会阻塞，其他时候不会。

AOF重写过程是由后台进程bgrewriteaof来完成的。主线程fork出后台的bgrewriteaof子进程，fork会把主线程的内存拷贝一份给bgrewriteaof子进程，这里面就包含了数据库的最新数据。然后，bgrewriteaof子进程就可以在不影响主线程的情况下，逐一把拷贝的数据写成操作，记入重写日志。

**AOF日志何时会重写？**

 - auto-aof-rewrite-min-size  表示运行AOF重写时文件的最小大小，默认为64MB。
 - auto-aof-rewrite-percentage  表示如果当前AOF文件的大小超过了上次重写后AOF文件的百分之多少后，就再次开始重写AOF文件。

**重写日志时，有新数据写入，怎么保证一致性？**

重写过程总结为：“一个拷贝，两处日志”。

在重写时，如果有新数据写入，主线程就会将命令记录到两个aof日志内存缓冲区中。

如果AOF写回策略配置的是always，则直接将命令写回旧的日志文件，并且保存一份命令至AOF重写缓冲区，这些操作对新的日志文件是不存在影响的。（旧的日志文件：主线程使用的日志文件，新的日志文件：bgrewriteaof进程使用的日志文件） 

而在bgrewriteaof子进程完成会日志文件的重写操作后，会提示主线程已经完成重写操作，主线程会将AOF重写缓冲中的命令追加到新的日志文件后面。

这时候在高并发的情况下，AOF重写缓冲区积累可能会很大，这样就会造成阻塞，Redis后来通过Linux管道技术让aof重写期间就能同时进行回放，这样aof重写结束后只需回放少量剩余的数据即可。 

最后通过修改文件名的方式，保证文件切换的原子性。 

在AOF重写日志期间发生宕机的话，因为日志文件还没切换，所以恢复数据时，用的还是旧的日志文件。

总结：
 - 主线程fork出子进程重写aof日志
 - 子进程重写日志完成后，主线程追加aof日志缓冲
 - 替换日志文件


### RDB和AOF混合使用
Redis 4.0 中提出了一个混合使用 AOF 日志和内存快照的方法。简单来说，内存快照以一定的频率执行，在两次快照之间，使用 AOF 日志记录这期间的所有命令操作。

这样一来，快照不用很频繁地执行，这就避免了频繁 fork 对主线程的影响。

混合持久化同样也是通过bgrewriteaof完成的，不同的是当开启混合持久化时，fork出的子进程先将共享的内存副本全量的以RDB方式写入aof文件，然后在将重写缓冲区的增量命令以AOF方式写入到文件，写入完成后通知主进程更新统计信息，并将新的含有RDB格式和AOF格式的AOF文件替换旧的的AOF文件。

这个方法既能享受到 RDB 文件快速恢复的好处，又能享受到 AOF 只记录操作命令的简单优势, 实际环境中用的很多。

### 从持久化文件中恢复数据
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210423182420981.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)

 - redis重启时判断是否开启aof，如果开启了aof，那么就优先加载aof文件；
 - 如果aof存在，那么就去加载aof文件，加载成功的话redis重启成功，如果aof文件加载失败，那么会打印日志表示启动失败，此时可以去修复aof文件后重新启动；
 - 若aof文件不存在，那么redis就会转而去加载rdb文件，如果rdb文件不存在，redis直接启动成功； 
 - 如果rdb文件存在就会去加载rdb文件恢复数据，如加载失败则打印日志提示启动失败，如加载成功，那么redis重启成功，且使用rdb文件恢复数据；

因为AOF保存的数据更完整，所以会优先加载AOF。


**参考**：

 1. [Redis进阶 - 持久化：RDB和AOF机制详解](https://www.pdai.tech/md/db/nosql-redis/db-redis-x-rdb-aof.html#%E6%B7%B1%E5%85%A5%E7%90%86%E8%A7%A3aof%E9%87%8D%E5%86%99)
 2. [Redis数据持久化之RDB-AOF混合方式](https://www.jianshu.com/p/446b12e4740f)
