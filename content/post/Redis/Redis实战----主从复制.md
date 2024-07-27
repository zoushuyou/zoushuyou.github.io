---

title:      "Redis实战----主从复制"
date:       2021-05-21
author: "shuyou"
categories: ["Code"]
tags:
    - Redis
---

> 本文介绍使用docker操作Redis主从复制相关内容

这里使用 docker-compose 来测试 Redis 的主从复制功能。

首先需要安装 docker 和 docker-compose 以及 Redis 镜像，这里就不再做这方面的安装介绍了。

安装好后，需要编写 docker-compose.yml 文件

```yaml
version: '3'
services:
  master:
    image: redis
    container_name: redis-master
    restart: always
    command: redis-server --port 6379 --requirepass master123  --appendonly yes
    ports:
      - 6379:6379
    volumes:
      - ./data/master:/data

  slave1:
    image: redis
    container_name: redis-slave-1
    restart: always
    command: redis-server --slaveof master 6379 --port 6380  --requirepass slave123 --masterauth master123  --appendonly yes
    ports:
      - 6380:6380
    volumes:
      - ./data/slave1:/data


  slave2:
    image: redis
    container_name: redis-slave-2
    restart: always
    command: redis-server --slaveof master 6379 --port 6381  --requirepass slave456 --masterauth master123  --appendonly yes
    ports:
      - 6381:6381
    volumes:
      - ./data/slave2:/data
```

然后在当前文件夹下，输入命令:   docker-compose up -d

运行结果：

```bash
zsy@zsy:~/redis/testSlave$ ll
total 16
drwxr-xr-x 3 zsy  zsy  4096 Oct 21 11:17 ./
drwxr-xr-x 4 zsy  zsy  4096 Oct 21 11:07 ../
drwxr-xr-x 5 root root 4096 Oct 21 11:17 data/
-rw-r--r-- 1 zsy  zsy  1112 Oct 21 11:17 docker-compose.yml
zsy@zsy:~/redis/testSlave$ docker ps -a
CONTAINER ID   IMAGE     COMMAND                  CREATED       STATUS          PORTS                              NAMES
20adf82b1afd   redis     "docker-entrypoint.s…"   3 hours ago   Up 3 hours      0.0.0.0:6379->6379/tcp             redis-master
6ba1c3c93d2e   redis     "docker-entrypoint.s…"   3 hours ago   Up 3 hours      6379/tcp, 0.0.0.0:6381->6381/tcp   redis-slave-2
96b023c4bc57   redis     "docker-entrypoint.s…"   3 hours ago   Up 15 minutes   6379/tcp, 0.0.0.0:6380->6380/tcp   redis-slave-1
zsy@zsy:~/redis/testSlave$

```

**测试主从复制**：

1. 测试是否能向从库写入数据？
2. 测试写入数据到主库，从库有没有数据？
3. 测试一个从库节点挂掉，主库写入数据，从库节点重启后，是否能同步主库数据？
4. 测试主库挂点，从库是否能读取数据？


答案：
1. 不能
2. 有
3. 能同步
4. 能

**参考：**
[docker-compose搭建redis哨兵集群](https://www.cnblogs.com/JulianHuang/p/12650721.html)
[使用docker 搭建redis的主从复制](https://cloud.tencent.com/developer/article/1693904)