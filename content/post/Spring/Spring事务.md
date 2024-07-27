---

title:      "Spring 事务相关知识"
date:       2021-03-23
author: "shuyou"
categories: ["Code"]
tags:
    - Spring
---

>本文介绍Spring事务相关的知识，包括事务隔离级别和事务传播特性。

### 事务
事务是逻辑上的一组操作，要么都执行，要么都不执行。我自己的理解是，数据库操作的最小单位，要么成功，要么失败。

**特性：ACID**

 - 原子性（Atomicity）：事务是最小的执行单位，不允许分割。事务的原子性确保动作要么全部完成，要么全部失败回滚。
 - 一致性（Consistency）：数据库在事务执行前后都保持一致性状态。在一致性状态下，所有事务对一个数据的读取结果都是相同的。
 - 隔离性（Isolation）：一个事务所做的修改在最终提交以前，对其他事务是不可见的。
 - 持久性（Durability）：一旦事务提交，则其所做的修改将会永远保存到数据库中。即使系统发生崩溃，事务执行的结果也不能丢失。

### 事务隔离级别
在并发环境下，事务的隔离性很难得到保证，因此会出现很多并发一致性的问题。

**丢失修改**
T1和T2 两个事务同时对一个数据进行修改，T1修改之后，T2又修改，T2的修改覆盖了T1的修改。

**读脏数据**
T1 修改一个数据，T2 随后读取这个数据。如果 T1 撤销了这次修改，那么 T2 读取的数据是脏数据。

**不可重复读**
T2 读取一个数据，T1 对该数据做了修改。如果 T2 再次读取这个数据，此时读取的结果和第一次读取的结果不同。

**幻读**
T1 读取某个范围的数据，T2 在这个范围内插入新的数据，T1 再次读取这个范围的数据，此时读取的结果和和第一次读取的结果不同。

**不可重复读的重点是修改，幻读的重点在于新增或者删除。**

在Spring中，TransactionDefinition 接口中定义了五个表示隔离级别的常量：

 1. **TransactionDefinition.ISOLATION_DEFAULT**：使用数据库默认的事务隔离级别
 2. **TransactionDefinition.ISOLATION_READ_UNCOMMITTED（未提交读）**：最低的隔离级别，允许读取尚未提交的数据变更，可能会导致脏读、幻读或不可重复读
 3. **TransactionDefinition.ISOLATION_READ_COMMITTED（读已提交）**：允许读取并发事务已经提交的数据，可以阻止脏读，但是幻读或不可重复读仍有可能发生
 4. **TransactionDefinition.ISOLATION_REPEATABLE_READ（可重复读）**：对同一字段的多次读取结果都是一致的，除非数据是被本身事务自己所修改，可以阻止脏读和不可重复读，但幻读仍有可能发生。
 5. **TransactionDefinition.ISOLATION_SERIALIZABLE（串行化）**：最高的隔离级别，完全服从ACID的隔离级别。所有的事务依次逐个执行，这样事务之间就完全不可能产生干扰，也就是说，该级别可以防止脏读、不可重复读以及幻读。但是这将严重影响程序的性能。通常情况下也不会用到该级别。

### 事务的传播机制
当事务方法被另一个事务方法调用时，必须指定事务应该如何传播。例如：方法可能继续在现有事务中运行，也可能开启一个新事务，并在自己的事务中运行。在TransactionDefinition定义中包括了如下几个表示传播行为的常量：

**支持当前事务**：

 - **TransactionDefinition.PROPAGATION_REQUIRED**：如果当前存在事务，则加入该事务；如果当前没有事务，则创建一个新的事务。
 - **TransactionDefinition.PROPAGATION_SUPPORTS**： 如果当前存在事务，则加入该事务；如果当前没有事务，则以非事务的方式继续运行。
 - **TransactionDefinition.PROPAGATION_MANDATORY**： 如果当前存在事务，则加入该事务；如果当前没有事务，则抛出异常。（mandatory：强制性）

**不支持当前事务**：

 - **TransactionDefinition.PROPAGATION_REQUIRES_NEW**： 创建一个新的事务，如果当前存在事务，则把当前事务挂起。
 - **TransactionDefinition.PROPAGATION_NOT_SUPPORTED**： 以非事务方式运行，如果当前存在事务，则把当前事务挂起。
 - **TransactionDefinition.PROPAGATION_NEVER**： 以非事务方式运行，如果当前存在事务，则抛出异常。

**其他情况**：

 - **TransactionDefinition.PROPAGATION_NESTED**： 如果当前存在事务，则创建一个事务作为当前事务的嵌套事务来运行；如果当前没有事务，则创建一个新的事务。


**参考**

 1. [SQL DB - 数据库系统核心知识点](https://www.pdai.tech/md/db/sql/sql-db-theory.html)
 2. [Spring事务管理详解](https://juejin.cn/post/6844903608224333838)
 3. [Spring事务传播机制详解](https://blog.csdn.net/qq_26323323/article/details/81908955?utm_medium=distribute.pc_relevant_t0.none-task-blog-2~default~BlogCommendFromMachineLearnPai2~default-1.control&dist_request_id=1328679.64251.16164914922937405&depth_1-utm_source=distribute.pc_relevant_t0.none-task-blog-2~default~BlogCommendFromMachineLearnPai2~default-1.control)
