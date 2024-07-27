---

title:      "Tomcat报错及解决方案"
date:       2021-10-25
author: "shuyou"
categories: ["Code"]
tags:      
    - Tomcat
---

最近试着在wsl2中使用docker跑公司的web项目，但是tomcat容器会报错

# 报错

```xml
 java.lang.illegalargumentexception the main resource set specified [...] is not valid in Tomcat
```

# 解决方案

将 %CATALINA_HOME%/conf/server.xml 中的

```xml
<Context docBase="" path="/web" reloadable="false" />
```
删除掉

并在 %CATALINA_HOME%/conf/Catalina/localhost 中创建 ROOT.xml 文件 ，写入以下内容

```xml
<Context docBase="<yourApp>" path="/web" reloadable="false" />
```

我本机是成功解决了报上述错的问题。


# JDK版本问题

```xml
java.lang.ClassNotFoundException: javax.xml.bind.JAXBException
```
使用的镜像是 tomcat8.5 ，但是它是JDK11，会报上述错误

原因：JAXB API是java EE 的API，因此在java SE 9.0 中不再包含这个 Jar 包。
java 9 中引入了模块的概念，默认情况下，Java SE中将不再包含java EE 的Jar包
而在 java 6/7 / 8 时关于这个API 都是捆绑在一起的

# 解决方案

降低 JDK 版本

参考：
[How to solve common problems when using Tomcat](https://ducmanhphan.github.io/2020-01-09-How-to-solve-common-problems-when-using-Tomcat/)
[真正解决方案：java.lang.ClassNotFoundException: javax.xml.bind.JAXBException](https://blog.csdn.net/hadues/article/details/79188793)