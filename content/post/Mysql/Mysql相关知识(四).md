---

title:      "Mysql相关知识（四）"
date:       2021-04-13
author: "shuyou"
categories: ["Code"]
tags:
    - Mysql
---
>本文介绍Mysql中explain相关知识

**explain**:
当mysql的查询语句执行较慢时，可以通过使用explain命令解释mysql语句，通过结果分析mysql语句执行慢的原因，来优化mysql语句。

expain出来的信息有10列：
 - id
 - select_type
 - table
 - type
 - possible_keys
 - key
 - key_len
 - ref
 - rows
 - Extra

**id：SQL执行的顺序的标识,SQL根据id从大到小的执行**

id列的编号是 select 的序列号，有几个 select 就有几个id，并且id的顺序是按 select 出现的顺序增长的。MySQL将 select 查询分为简单查询和复杂查询。复杂查询分为三类：简单子查询、派生表（from语句中的子查询）、union 查询。

 1. id相同时，执行顺序由上至下
 2. 如果是子查询，id的序号会递增，id值越大优先级越高，越先被执行
 3. id如果相同，可以认为是一组，从上往下顺序执行；在所有组中，id值越大，优先级越高，越先执行

**select_type：查询中每个select子句的类型**

 1. simple：简单查询。查询不包含子查询和union
 2. primary：复杂查询中最外层的 select
 3. subquery：包含在 select 中的子查询（不在 from 子句中）
 4. derived：包含在 from 子句中的子查询。MySQL会将结果存放在一个临时表中，也称为派生表（derived的英文含义）

```yaml
mysql> explain select (select 1 from actor where id = 1) from (select * from film where id = 1) der;
+----+-------------+------------+--------+---------------+---------+---------+-------+------+-------------+
| id | select_type | table      | type   | possible_keys | key     | key_len | ref   | rows | Extra       |
+----+-------------+------------+--------+---------------+---------+---------+-------+------+-------------+
|  1 | PRIMARY     | <derived3> | system | NULL          | NULL    | NULL    | NULL  |    1 | NULL        |
|  3 | DERIVED     | film       | const  | PRIMARY       | PRIMARY | 4       | const |    1 | NULL        |
|  2 | SUBQUERY    | actor      | const  | PRIMARY       | PRIMARY | 4       | const |    1 | Using index |
+----+-------------+------------+--------+---------------+---------+---------+-------+------+-------------+ 
```

5. union：在 union 中的第二个和随后的 select
6. union result：从 union 临时表检索结果的 select

```yaml
mysql> explain select 1 union all select 1;
+----+--------------+------------+------+---------------+------+---------+------+------+-----------------+
| id | select_type  | table      | type | possible_keys | key  | key_len | ref  | rows | Extra           |
+----+--------------+------------+------+---------------+------+---------+------+------+-----------------+
|  1 | PRIMARY      | NULL       | NULL | NULL          | NULL | NULL    | NULL | NULL | No tables used  |
|  2 | UNION        | NULL       | NULL | NULL          | NULL | NULL    | NULL | NULL | No tables used  |
| NULL | UNION RESULT | <union1,2> | ALL  | NULL          | NULL | NULL    | NULL | NULL | Using temporary |
+----+--------------+------------+------+---------------+------+---------+------+------+-----------------+
```
**table：正在访问哪个表**

**type：表示MySQL在表中找到所需行的方式，又称“访问类型”**
常用的类型有： ALL, index,  range, ref, eq_ref, const, system, NULL（从左到右，性能从差到好）

 - ALL：即全表扫描，意味着mysql需要从头到尾去查找所需要的行。通常情况下这需要增加索引来进行优化了
 - index: 和ALL一样，不同就是mysql只需扫描索引树，这通常比ALL快一些。
 - range:范围扫描通常出现在 in(), between ,> ,<, >= 等操作中。使用一个索引来检索给定范围的行。
 - ref: 表示上述表的连接匹配条件，即哪些列或常量被用于查找索引列上的值
 - eq_ref: 类似ref，区别就在使用的索引是唯一索引，对于每个索引键值，表中只有一条记录匹配，简单来说，就是多表连接中使用primary key或者 unique key作为关联条件
 - const、system: 当MySQL对查询某部分进行优化，并转换为一个常量时，使用这些类型访问。如将主键置于where列表中，MySQL就能将该查询转换为一个常量,system是const类型的特例，当查询的表只有一行的情况下，使用system
 - NULL: mysql能够在优化阶段分解查询语句，在执行阶段用不着再访问表或索引。例如：在索引列中选取最小值，可以单独查找索引来完成，不需要在执行时访问表。

**possible_keys：查询可能使用哪些索引来查找**

**key：实际采用哪个索引来优化对该表的访问**

**key_len：mysql在索引里使用的字节数，通过这个值可以算出具体使用了索引中的哪些列**
![字节长度](https://img-blog.csdnimg.cn/2021041322293393.png?x-oss-process=image,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**ref：显示了在key列记录的索引中，表查找值所用到的列或常量**

**rows： 表示MySQL根据表统计信息及索引选用情况，估算的找到所需的记录所需要读取的行数**

**Extra：展示的是额外信息**

 - distinct: 一旦mysql找到了与行相联合匹配的行，就不再搜索了
 - Using index：这发生在对表的请求列都是同一索引的部分的时候，返回的列数据只使用了索引中的信息，而没有再去访问表中的行记录。是性能高的表现。
 - Using where：mysql服务器将在存储引擎检索行后再进行过滤。就是先读取整行数据，再按 where 条件进行检查，符合就留下，不符合就丢弃。
 - Using temporary：mysql需要创建一张临时表来处理查询。出现这种情况一般是要进行优化的，首先是想到用索引来优化。
 - Using filesort：mysql 会对结果使用一个外部索引排序，而不是按索引次序从表里读取行。此时mysql会根据联接类型浏览所有符合条件的记录，并保存排序关键字和行指针，然后排序关键字并按顺序检索行信息。这种情况下一般也是要考虑使用索引来优化的。

**参考**：

 1. [Mysql Explain详解](https://cloud.tencent.com/developer/article/1093229)
