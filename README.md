# 迁移博客

## 本地运行

安装最新版的hugo，依赖go环境

编译
hugo -t hugo-theme-cleanwhite


本地直接运行
hugo serve -t  hugo-theme-cleanwhite

## 调整样式

因为 `/themes` 目录下的主题被设置位git子模块，调整个性化的主题样式时，需要对git子模块改动进行提交。

提交并推送到子模块的master分支

只改动博文的时候不需要，仅需提交并推送父模块的main主分支

采用了github action自动部署，workflows配置文件中， actions/checkout@v4 不带子模块

