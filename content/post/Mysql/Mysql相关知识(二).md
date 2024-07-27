---

title:      "Mysql相关知识（二）"
date:       2021-04-09
author: "shuyou"
categories: ["Code"]
tags:
    - Mysql
---

>本文介绍Mysql操作和语句相关知识，包括增删改查、建表、函数、过程等相关知识。

### 1.操作
**连接Mysql**：

```yaml
mysql -h 主机地址 -u 用户名 -p 密码

本地连接：
mysql -u root -p
```
**修改密码**：

```yaml
mysqladmin -u 用户名 -p 旧密码 password 新密码

或者

alter user `username`@`host` identified by 'password'
```

**增加权限**：

```yaml
grant all privileges on databasename.tablename to 用户名@登录主机 identified by 密码

增加一个用户 test1 密码为 abc，让他可以在任何主机上登录，并对所有数据库
有查询、插入、修改、删除的权限：

grant select,insert,update,delete on . to `test1`@`localhost` identified by "abc"
```

**删除授权**：

```yaml
revoke all privileges on  databasename.tablename from `username`@`host`
```
**创建用户**：

```yaml
create user `username`@`host` identified by 'password'

要求使用ssl登录
create user `username`@`host` identified by 'password' require ssl;
```

**锁定用户**

```yaml
alter user `username`@`host` account lock;

解锁
alter user `username`@`host` account unlock;
```
**删除用户**：

```yaml
drop user `username`@`host`
```


### 2.常用命令
**数据库**：

```yaml
show databases; #显示数据库

create database [if not exists] t [character set='utf8']; #建数据库

use t; #使用数据库

drop database t; #删除数据库

show tables; #显示表

#建表
CREATE TABLE `T` (
  `id` int NOT NULL AUTO_INCREMENT,
  `a` varchar(30) DEFAULT NULL,
  `b` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `a` (`a`),
  KEY `b` (`b`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

#查看建表语句
show create table `T`;

#显示表结构
desc T;

#删除表
drop table [if exists] T;
```

**表复制、备份、清除**

```yaml
#会造成索引丢失，只有表结构，没有主键等信息。
create table 新表名 select * from T;
或
create table 新表名 as(select * from T);

#讲旧表中的数据移入新表
insert into 新表 select * from T;

#清空表数据
truncate table T;
```

**表相关操作**：

```yaml
#修改列名
alter table T change <原字段名称> <新字段名称 字段类型>

#修改表名
alter table T rename newT

#修改字段类型及指定是否为空
alter table T modify(or change) <字段名称> <字段类型> [not null]

#增加一个字段
alter table T add column 字段名称 字段类型 (after 某个字段) (first)

#删除字段
alter table <表名称> drop column <列名>;
```

**查表**：

```yaml
SELECT [DISTINCT] <字段名称,用逗号隔开/*>

FROM <left_table> [<join_type> JOIN <right_table> ON <连接条件>]

WHERE <where条件>

GROUP BY <分组字段>

HAVING <筛选条件>

ORDER BY <排序条件> [desc/asc]

LIMIT n[, m]
```

**增改删**：

```yaml
#增加数据
insert into T values();

#更改数据
update T set *** where ** = **

#删除数据
delete FROM T WHERE ** = **
```

**索引**：

```yaml
#创建索引
-- 普通索引
ALTER TABLE 表名称 ADD INDEX index_name (column_list)
-- 唯一索引
ALTER TABLE 表名称 ADD UNIQUE (column_list)
-- 主键索引
ALTER TABLE 表名称 ADD PRIMARY KEY (column_list)

或者
CREATE INDEX index_name ON 表名称 (column_list)

#删除索引
DROP INDEX index_name ON 表名称;
ALTER TABLE 表名称 DROP INDEX index_name;
#删除主键
alter table T drop primary key;

#查看索引
show index from T;
show keys from T;
```
**变量**：

```yaml
#查看满足条件的部分系统变量
show global | session variables like '%char%';
查看指定的某个系统变量的值
select @@global|session.系统变量名;

#为某个系统变量赋值
set global|session 系统变量名 = 值;
或
set @@global|session.系统变量名 = 值;

#用户变量声明并初始化
set @用户变量名=值

#使用
select @用户变量名

#声明局部变量
declare 变量名 类型;
declare 变量名 类型 default 值;

#赋值和使用同用户变量一样
```
**存储过程**：

```yaml
#创建存储过程
create procedure 存储过程名(参数列表)
begin
	方法体(一组合法的sql语句)
end

#存储过程的结尾可以使用delimiter重新设置
delimiter 结束标志
例：
delimiter $

#创建过程
delimiter ;;
create procedure idata()
begin
  declare i int;
  set i=1;
  while(i<=100000)do
    insert into t values(i, i, i);
    set i=i+1;
  end while;
end;;
delimiter ;

#调用
call idata();

#查看存储过程
show create procedure 存储过程名;
#删除存储过程
drop procedure 存储过程名;
```

**函数**：

```yaml
#创建函数
create function 函数名（参数列表）returns 返回类型
begin
函数体
end

注意事项：
1.参数列表包含两部分：参数名 参数类型
2.函数体：必须要有return语句，没有回报错。如果return语句没有放在函数体的最后也不报错，但不建议
3.begin end用法与存储过程相同，

#调用语法
select 函数名（参数列表）

#例
create function myfunc() returns int
begin
	declare c int default 0;
	select count(*) into c
	from T;
	return c;
end;

select myfunc();

#查看函数
show create function 函数名;
#删除函数
drop function 函数名;
```

**参考**：

 1. [Mysql-视图、变量、存储过程以及函数](https://blog.csdn.net/zSoaring/article/details/115370995)
 2. [Mysql语句大全](https://www.ucloud.cn/yun/49368.html)
