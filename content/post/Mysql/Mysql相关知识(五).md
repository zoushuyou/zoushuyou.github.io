---

title:      "Mysql相关知识（五）"
date:       2021-04-16
author: "shuyou"
categories: ["Code"]
tags:
    - Mysql
---

>本文介绍Mysql ACID特性的实现原理

**ACID**:

 - 原子性
 - 一致性
 - 隔离性
 - 持久性

**原子性**：一个事务是一个不可切割的单位，要么全部执行成功，要么全部失败。

是采用undo log日志实现的。undo log日志用来记录Mysql逻辑语句的执行。

当事务对数据库进行修改时，InnoDB会生成对应的undo log；如果事务执行失败或调用了rollback，导致事务需要回滚，便可以利用undo log中的信息将数据回滚到修改之前的样子。

当发生回滚时，InnoDB会根据undo log的内容做与之前相反的工作：对于每个insert，回滚时会执行delete；对于每个delete，回滚时会执行insert；对于每个update，回滚时会执行一个相反的update，把数据改回去。

**一致性**：数据库在事务执行前后都保持一致性状态。在一致性状态下，所有事务对一个数据的读取结果都是相同的。


从数据库层面，数据库通过原子性、隔离性、持久性来保证一致性。也就是说ACID四大特性之中，C(一致性)是目的，A(原子性)、I(隔离性)、D(持久性)是手段，是为了保证一致性，数据库提供的手段。数据库必须要实现AID三大特性，才有可能实现一致性。例如，原子性无法保证，显然一致性也无法保证。

但是，如果你在事务里故意写出违反约束的代码，一致性还是无法保证的。例如，你在转账的例子中，你的代码里故意不给B账户加钱，那一致性还是无法保证。因此，还必须从应用层角度考虑。

从应用层面，通过代码判断数据库数据是否有效，然后决定回滚还是提交数据！

**隔离性**：事务内部的操作与其他事务是隔离的，并发执行的各个事务之间不能互相干扰。

隔离性主要解决并发环境下，事务之间互不干扰，因为并发情况下会出现并发一致性问题。
 - 丢失修改
 - 脏读
 - 不可重复读
 - 幻读

这些并发一致性问题，从读写角度考虑，可以通过不同的方式解决

 - (一个事务)写操作对(另一个事务)写操作的影响：锁机制保证隔离性
 - (一个事务)写操作对(另一个事务)读操作的影响：MVCC保证隔离性

按照锁的粒度，可以分位表锁和行锁。MyIsam只支持表锁，而InnoDB同时支持表锁和行锁。

MVCC（Multi-Version Concurrency Control）：多版本并发控制，通过版本链、undo log、ReadView实现。

 - 隐藏列：InnoDB中每行数据都有隐藏列，隐藏列中包含了本行数据的事务id、指向undo log的指针等。
 - 基于undo log的版本链：前面说到每行数据的隐藏列中包含了指向undo log的指针，而每条undo log也会指向更早版本的undo log，从而形成一条版本链。
 - ReadView：通过隐藏列和版本链，MySQL可以将数据恢复到指定版本；但是具体要恢复到哪个版本，则需要根据ReadView来确定。所谓ReadView，是指事务（记做事务A）在某一时刻给整个事务系统（trx_sys）打快照，之后再进行读操作时，会将读取到的数据中的事务id与trx_sys快照比较，从而判断数据对该ReadView是否可见，即对事务A是否可见。

ReadView中的重要id

 - trx_ids: 当前系统活跃(未提交)事务版本号集合。
 - low_limit_id: 创建当前read view 时“当前系统最大事务版本号+1”。
 - up_limit_id: 创建当前read view 时“系统正处于活跃事务最小版本号”
 - creator_trx_id: 创建当前read view的事务版本号；

SQL标准中定义了四种隔离级别，并规定了每种隔离级别下上述几个问题是否存在，mysql默认的隔离级别为RR（可重复读）。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210416225104783.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
上面说的MVCC用于支持RC和RR的实现，是一种非加锁的形式。

 - RR是在事务开始后第一次执行select前创建ReadView，直到事务提交都不会再创建。根据前面的介绍，RR可以避免脏读、不可重复读和幻读。
 - RC每次执行select前都会重新建立一个新的ReadView，因此如果事务A第一次select之后，事务B对数据进行了修改并提交，那么事务A第二次select时会重新建立新的ReadView，因此事务B的修改对事务A是可见的。因此RC隔离级别可以避免脏读，但是无法避免不可重复读和幻读。

解决幻读：

 - 通过MVCC非加锁读，也称作快照读、一致性读
 - 加锁读：record lock(记录锁) + gap lock(间隙锁)

**持久性**：事务一旦提交，它对数据库的改变就应该是永久性的。接下来的其他操作或故障不应该对其有任何影响。

使用redo log实现，保证数据库在宕机的情况下，数据也不会丢失。

redo log 和 bin log的区别：

 - 作用不同：redo log是用于crash recovery的，保证MySQL宕机也不会影响持久性；binlog是用于point-in-time recovery的，保证服务器可以基于时间点恢复数据，此外binlog还用于主从复制。
 - 层次不同：redo log是InnoDB存储引擎实现的，而binlog是MySQL的服务器层(可以参考文章前面对MySQL逻辑架构的介绍)实现的，同时支持InnoDB和其他存储引擎。
 - redo log是物理日志，内容基于磁盘的Page；binlog的内容是二进制的，根据binlog_format参数的不同，可能基于sql语句、基于数据本身或者二者的混合。
 - 写入时机不同：binlog在事务提交时写入；redo log的写入时机相对多元：事务提交时、master thread每秒刷盘等。

**参考**：

 1. [深入学习Mysql事务](https://www.cnblogs.com/kismetv/p/10331633.html)
 2. [数据库MVCC](https://www.cnblogs.com/kismetv/p/10331633.html)
