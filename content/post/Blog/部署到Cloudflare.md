---
title: "部署到Cloudflare"
date: 2024-11-03
author: "shuyou"
categories: ["Blog"]
tags:
    - Blog
---

>部署到Cloudflare

# 背景：

前段时间买了个域名shuyou.fun，想着给博客换个域名，顺便部署到Cloudflare。

# 更改：

大多数步骤网上都能搜到，这里简略记录下过程。

1.之前的主题，由于github action和git submodule有冲突，自己fork出了一个主题做子模块。

2.不习惯用npm，自己定制化了搜索，也是参考之前Hux的搜索进行调整的。

3.本来是部署到serv00的，但是每次要编译上传public目录，有点麻烦，便改成了使用Cloudflare自动部署。
