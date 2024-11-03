---
title: "从hexo迁移到hugo"
date: 2024-06-10
author: "shuyou"
categories: ["Blog"]
tags:
    - Blog
---

>本文介绍下从hexo迁移到hugo的过程

# 背景：

之前博客使用hexo框架搭建和部署的，用的是hux主题。

因为一直不太习惯用npm，所以这些天干脆把博客从hexo迁移到hugo了。

一开始是想沿用之前的hux主题，网上搜了几天都没找到，后面搭建的时候挑了NEXT主题，搭建的时候了解github action，无意间又找到了puppet主题（hux主题的hugo版），想着还是换个主题换个心情，还是用NEXT主题了。

后面又发现了[cleanwhite主题](https://github.com/zhaohuabing/hugo-theme-cleanwhite)，感谢[zhaohuabing](https://www.zhaohuabing.com/)提供这么好看、好用的主题。 

由于不想用npm、搜索功能就自己做了适配，未使用主题中推荐的Algolia。

# 迁移：

大多数步骤网上都能搜到，这里不做详细介绍了（自己鼓捣了几天，也没做记录~~~~~~），简略记录下过程。

1.需要安装hugo、配置hugo环境变量。

2.安装[cleanwhite主题](https://github.com/zhaohuabing/hugo-theme-cleanwhite)主题，调整配置，个性化搜索。

3.使用github action自动部署。
