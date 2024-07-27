---
title:      "Redis实战----哨兵机制"
date:       2021-05-21
author: "shuyou"
categories: ["Code"]
tags:
    - Redis
---

> 本文介绍使用docker操作Redis哨兵机制相关内容

还是使用 docker-compose 来测试 Redis 的哨兵机制。

这里建议使用一个 docker-compose 来测试，我一开始是使用的两个 yaml 文件，会出现主节点挂掉之后，从节点无法切换为主节点的情况，搞了很久，后面看了下网上的说法，感觉应该是网络共享的问题。

先建立一个文件夹测试哨兵机制，这边是我的目录结构

```bash
zsy@zsy:~/redis/testSentinel$  ll
total 32
drwxr-xr-x 3 zsy  zsy  4096 Oct 21 17:23 ./
drwxr-xr-x 4 zsy  zsy  4096 Oct 21 15:41 ../
drwxr-xr-x 5 root root 4096 Oct 21 17:23 data/
-rw-r--r-- 1 zsy  zsy  1751 Oct 21 17:23 docker-compose.yml
-rw-r--r-- 1 zsy  zsy   264 Oct 21 17:21 sentinel.conf
-rw-r--r-- 1 zsy  zsy   264 Oct 21 17:21 sentinel1.conf
-rw-r--r-- 1 zsy  zsy   264 Oct 21 17:21 sentinel2.conf
-rw-r--r-- 1 zsy  zsy   264 Oct 21 17:21 sentinel3.conf
```

在文件夹里新建一个 docker-compose.yml

```yaml
version: '3'
services:
  master:
    image: redis
    container_name: redis-master
    restart: always
    command: redis-server --port 6379 --requirepass 123456  --masterauth 123456 --appendonly yes
    ports:
      - 6379:6379
    volumes:
      - ./data/master:/data
  slave1:
    image: redis
    container_name: redis-slave-1
    restart: always
    command: redis-server --slaveof master 6379 --port 6380  --requirepass 123456 --masterauth 123456  --appendonly yes
    ports:
      - 6380:6380
    volumes:
      - ./data/slave1:/data
    depends_on:
      - master
  slave2:
    image: redis
    container_name: redis-slave-2
    restart: always
    command: redis-server --slaveof master 6379 --port 6381  --requirepass 123456 --masterauth 123456  --appendonly yes
    ports:
      - 6381:6381
    volumes:
      - ./data/slave2:/data
    depends_on:
      - slave1
      - master

  sentinel1:
    image: redis
    container_name: redis-sentinel-1
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    restart: always
    ports:
      - 26379:26379
    volumes:
      - ./sentinel1.conf:/usr/local/etc/redis/sentinel.conf
    depends_on:
      - slave2
  sentinel2:
    image: redis
    container_name: redis-sentinel-2
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    restart: always
    ports:
      - 26380:26379
    volumes:
      - ./sentinel2.conf:/usr/local/etc/redis/sentinel.conf
    depends_on:
      - slave2
  sentinel3:
    image: redis
    container_name: redis-sentinel-3
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    restart: always
    ports:
      - 26381:26379
    volumes:
      - ./sentinel3.conf:/usr/local/etc/redis/sentinel.conf
    depends_on:
      - slave2

```
再新建 sentinel.conf 配置文件,并拷贝为3个文件供 sentinel 节点使用。

```conf
port 26379
dir /tmp
sentinel monitor mymaster 172.28.225.116 6379 2
sentinel auth-pass mymaster 123456
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 180000
sentinel deny-scripts-reconfig yes
```

然后执行命令： docker-compose up -d

**测试**：
杀掉 master 节点后，使用命令 docker logs redis-sentinel-1 查看日志：

```bash
zsy@zsy:~/redis/testSentinel$ docker logs redis-sentinel-1
1:X 21 Oct 2021 09:24:04.292 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
1:X 21 Oct 2021 09:24:04.292 # Redis version=6.2.6, bits=64, commit=00000000, modified=0, pid=1, just started
1:X 21 Oct 2021 09:24:04.292 # Configuration loaded
1:X 21 Oct 2021 09:24:04.293 * monotonic clock: POSIX clock_gettime
1:X 21 Oct 2021 09:24:04.293 * Running mode=sentinel, port=26379.
1:X 21 Oct 2021 09:24:04.299 # Could not rename tmp config file (Device or resource busy)
1:X 21 Oct 2021 09:24:04.299 # WARNING: Sentinel was not able to save the new configuration on disk!!!: Device or resource busy
1:X 21 Oct 2021 09:24:04.299 # Sentinel ID is 44a0f4c7217b06a20a66efd4987bb54228cf0fc1
1:X 21 Oct 2021 09:24:04.299 # +monitor master mymaster 172.28.225.116 6379 quorum 2
1:X 21 Oct 2021 09:24:04.304 * +slave slave 172.20.0.3:6380 172.20.0.3 6380 @ mymaster 172.28.225.116 6379
1:X 21 Oct 2021 09:24:04.306 # Could not rename tmp config file (Device or resource busy)
1:X 21 Oct 2021 09:24:04.306 # WARNING: Sentinel was not able to save the new configuration on disk!!!: Device or resource busy
1:X 21 Oct 2021 09:24:04.306 * +slave slave 172.20.0.4:6381 172.20.0.4 6381 @ mymaster 172.28.225.116 6379
1:X 21 Oct 2021 09:24:04.309 # Could not rename tmp config file (Device or resource busy)
1:X 21 Oct 2021 09:24:04.309 # WARNING: Sentinel was not able to save the new configuration on disk!!!: Device or resource busy
1:X 21 Oct 2021 09:24:05.668 * +sentinel sentinel e83e00583428b608fe07105eb458d69817175fb3 172.20.0.5 26379 @ mymaster 172.28.225.116 6379
1:X 21 Oct 2021 09:24:05.678 # Could not rename tmp config file (Device or resource busy)
1:X 21 Oct 2021 09:24:05.678 # WARNING: Sentinel was not able to save the new configuration on disk!!!: Device or resource busy
1:X 21 Oct 2021 09:24:06.079 * +sentinel sentinel 79bf36c262e20b0544b99bd0ac0ac43fe5164789 172.20.0.6 26379 @ mymaster 172.28.225.116 6379
1:X 21 Oct 2021 09:24:06.122 # Could not rename tmp config file (Device or resource busy)
1:X 21 Oct 2021 09:24:06.122 # WARNING: Sentinel was not able to save the new configuration on disk!!!: Device or resource busy
1:X 21 Oct 2021 09:25:19.047 # +sdown master mymaster 172.28.225.116 6379
1:X 21 Oct 2021 09:25:19.111 # Could not rename tmp config file (Device or resource busy)
1:X 21 Oct 2021 09:25:19.111 # WARNING: Sentinel was not able to save the new configuration on disk!!!: Device or resource busy
1:X 21 Oct 2021 09:25:19.111 # +new-epoch 1
1:X 21 Oct 2021 09:25:19.113 # Could not rename tmp config file (Device or resource busy)
1:X 21 Oct 2021 09:25:19.113 # WARNING: Sentinel was not able to save the new configuration on disk!!!: Device or resource busy
1:X 21 Oct 2021 09:25:19.113 # +vote-for-leader 79bf36c262e20b0544b99bd0ac0ac43fe5164789 1
1:X 21 Oct 2021 09:25:19.113 # +odown master mymaster 172.28.225.116 6379 #quorum 3/2
1:X 21 Oct 2021 09:25:19.113 # Next failover delay: I will not start a failover before Thu Oct 21 09:31:19 2021
1:X 21 Oct 2021 09:25:19.388 # +config-update-from sentinel 79bf36c262e20b0544b99bd0ac0ac43fe5164789 172.20.0.6 26379 @ mymaster 172.28.225.116 6379
1:X 21 Oct 2021 09:25:19.388 # +switch-master mymaster 172.28.225.116 6379 172.20.0.4 6381
1:X 21 Oct 2021 09:25:19.388 * +slave slave 172.20.0.3:6380 172.20.0.3 6380 @ mymaster 172.20.0.4 6381
1:X 21 Oct 2021 09:25:19.388 * +slave slave 172.28.225.116:6379 172.28.225.116 6379 @ mymaster 172.20.0.4 6381
1:X 21 Oct 2021 09:25:19.391 # Could not rename tmp config file (Device or resource busy)
1:X 21 Oct 2021 09:25:19.391 # WARNING: Sentinel was not able to save the new configuration on disk!!!: Device or resource busy
1:X 21 Oct 2021 09:25:49.476 # +sdown slave 172.28.225.116:6379 172.28.225.116 6379 @ mymaster 172.20.0.4 6381
```

**参考**：
[使用docker 搭建redis的哨兵机制](https://cloud.tencent.com/developer/article/1693903)