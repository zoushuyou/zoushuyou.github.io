---

title:      "Cookie、Session和Token相关知识"
date:       2021-07-16
author: "shuyou"
categories: ["Code"]
tags:      
    - Tomcat
---

>本文介绍Cookie、Session和Token相关知识

**什么是Cookie**

由于Http是无状态的协议，这意味着一旦数据提交后，客户端与服务器的连接就会关闭，再次交互的时候需要重新建立新的连接。

服务器无法确认用户信息，于是W3C就提出给每个用户发一个通行证，无论谁访问都携带通行证，这样服务器就能从通行证上确认用户信息，这个通行证就是cookie。

- cookie存储在客户端：cookie 是服务器发送到用户浏览器并保存在本地的一小块数据，它会在浏览器下次向同一服务器再发起请求时被携带并发送到服务器上。
- cookie是不可跨域的： 每个 cookie 都会绑定单一的域名，无法在别的域名下获取使用，一级域名和二级域名之间是允许共享使用的（靠的是 domain）。

在servlet中使用cookie

```java
	response.setContentType("text/html;charset=UTF-8");
	Cookie cookie = new Cookie("user","zsy");
	cookie.setMaxAge(30000);
	response.addCookie(cookie);
	response.getWriter().write("返回Cookie");
```

**什么是Session**

Session 是另⼀种记录浏览器状态的机制。Cookie保存在浏览器中， 而Session保存在服务器中。⽤户使⽤浏览器访问服务器的时候，服务器把⽤户的信息以某种的形式记录在服务器，这就是Session。

- Session可以存储任何类型的数据，而Cookie只能存字符串
- Session存在服务器，Cookie存在客户端浏览器上
- Session是基于Cookie实现的，依赖于名为JSESSIONID的Cookie
- Cookie 可设置为长时间保持，比如我们经常使用的默认登录功能，Session 一般失效时间较短，客户端关闭（默认情况下）或者 Session 超时都会失效

在servlet中使用session

```java
	//得到Session对象
	HttpSession httpSession = request.getSession();
	//设置Session属性
	httpSession.setAttribute("name", "看完博客就要点赞！！ ");
	//得到Session对象
	HttpSession httpSession = request.getSession();
	//设置Session属性
	httpSession.setAttribute("name", "看完博客就要点赞！！ ");
```

**什么是Token**

token是访问资源接口（API）时所需要的资源凭证

- 每一次请求都需要携带 token，需要把 token 放到 HTTP 的 Header 里
- 基于 token 的用户认证是一种服务端无状态的认证方式，服务端不用存放 token 数据。用解析 token 的计算时间换取 session 的存储空间，从而减轻服务器的压力，减少频繁的查询数据库
- 使用JWT（Json Web Token）可以解决跨域相关问题