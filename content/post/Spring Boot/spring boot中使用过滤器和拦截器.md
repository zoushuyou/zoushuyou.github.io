---

title:      "Spring Boot中使用过滤器和拦截器"
date:       2021-09-10
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Boot
---

>过滤器（Filter）和拦截器（Interceptor）是Web项目中常用的两个功能，本文将简单介绍在Spring Boot中使用过滤器和拦截器。

#### Filter

过滤器可以用于过滤一些非法字符、权限检查等操作

**在Spring Boot中可以通过注解@WebFilter或者使用配置类来实现过滤器**


**1.通过注解**

```java
@WebFilter("/*")
public class MyFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        System.out.println("过滤器初始化");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        System.out.println("开始执行过滤器");
        Long start = System.currentTimeMillis();
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        String s = httpServletRequest.getRequestURL().toString();
        if (s.contains("/user")){
            response.setCharacterEncoding("utf-8");
            response.setContentType("text/json;charset=UTF-8");
            PrintWriter writer = response.getWriter();
            writer.write("不允许访问此url");
            writer.flush();
            writer.close();
        }
        chain.doFilter(request, response);
        System.out.println("【过滤器】耗时 " + (System.currentTimeMillis() - start));
        System.out.println("结束执行过滤器");
    }

    @Override
    public void destroy() {
        System.out.println("过滤器销毁");
    }
}
```
这样当访问"/user"时，会在浏览器显示"不允许访问此url"。
![在这里插入图片描述](https://img-blog.csdnimg.cn/445df7996b9c446d889bcacf587f6364.png)
**2.通过配置类**

```java
@Configuration
public class WebConfig{
    @Bean
    public FilterRegistrationBean timeFilter(){
        FilterRegistrationBean filterRegistrationBean = new FilterRegistrationBean();
        MyFilter myFilter = new MyFilter();
        filterRegistrationBean.setFilter(myFilter);

        List<String> urlList = new ArrayList<>();
        urlList.add("/*");
        filterRegistrationBean.setUrlPatterns(urlList);
        return filterRegistrationBean;
    }
}
```
上述配置类也会对所有url进行过滤。

#### 2.拦截器
拦截器需要实现HandlerInterceptor接口

```java
@Component
public class MyInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        System.out.println("处理拦截之前");
        request.setAttribute("startTime", System.currentTimeMillis());
        if (null == request.getSession().getAttribute("SESSION")){
            response.sendRedirect(request.getContextPath() + "/login");
            return false;
        }
        System.out.println(((HandlerMethod) handler).getBean().getClass().getName());
        System.out.println(((HandlerMethod) handler).getMethod().getName());
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        System.out.println("开始处理拦截");
        Long start = (Long) request.getAttribute("startTime");
        System.out.println("【拦截器】耗时 " + (System.currentTimeMillis() - start));
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        System.out.println("处理拦截之后");
        Long start = (Long) request.getAttribute("startTime");
        System.out.println("【拦截器】耗时 " + (System.currentTimeMillis() - start));
        System.out.println("异常信息 " + ex);
    }
}
```
上述拦截器会判断是否登录，对未登录的进行拦截。
还需进行注册才能生效。

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    MyInterceptor myInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(myInterceptor)
                .addPathPatterns("/user")
                .excludePathPatterns("/jacksonSerialization");
    }
}
```
过滤器要先于拦截器执行，晚于拦截器结束。
![在这里插入图片描述](https://img-blog.csdnimg.cn/193b1f3e60774feaa0125348ba1a9e32.png?x-oss-process=image,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP6Iiffg==,size_16,color_FFFFFF,t_70,g_se,x_16)
上图很好的描述了他们的执行时间。


**参考**：

 1. [Spring Boot中使用过滤器和拦截器](https://mrbird.cc/Spring-Boot-Filter-Interceptor.html)
