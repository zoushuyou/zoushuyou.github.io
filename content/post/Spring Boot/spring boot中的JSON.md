---

title:      "Spring Boot中操作JSON"
date:       2021-09-07
author: "shuyou"
categories: ["Code"]
tags:
    - Spring Boot
---

>本文介绍常用的JSON相关操作，Spring Boot内置Jackson包可以进行JSON相关操作

## 序列化
#### Fastjson

```java
        User user1 = new User();
        String s1 = JSON.toJSONString(user1);
        System.out.println(s1);
```

#### Jackson
```java
        ObjectMapper objectMapper = new ObjectMapper();
        String s2 = objectMapper.writeValueAsString(user);
        System.out.println(s2);
```

## 反序列化

#### Fastjson
```java
        String s ="{\n" +
                "  \"id\": 1,\n" +
                "  \"userName\": \"zhangsan\",\n" +
                "  \"password\": \"123456\",\n" +
                "  \"userSex\": \"man\",\n" +
                "  \"nickName\": \"asdf\",\n" +
                "  \"birthday\": \"2000-09-11 00:00:00\"\n" +
                "}";
        User user = JSON.parseObject(s, User.class);
        System.out.println(user.toString());
```

#### Jackson
```java
        User user = (User) objectMapper.readValue(s, User.class);
        System.out.println(user.toString());
```

## 自定义ObjectMapper
Spring Boot内置了Jackson来完成JSON的序列化和反序列化。

在Spring中使用@ResponseBody注解可以将方法返回的对象序列化成json串

在Spring Boot中可以自定义一个ObjectMapper来序列化我们想要返回的格式，比如序列化时间

```java
package com.springboot.demos.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.text.SimpleDateFormat;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-09-07 15:22
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper getObjectMapper(){
        ObjectMapper mapper = new ObjectMapper();
        mapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
        return mapper;
    }
}

```

这样就会返回如下json串：

```java
{
  "id": 1,
  "userName": "zhangsan",
  "password": "123456",
  "nickName": "asdf",
  "birthday": "2000-09-11 00:00:00",
  "sex": "man"
}
```
## Jackson注解
#### 1.@JsonProperty
@JsonProperty，作用在属性上，用来为JSON Key指定一个别名。

#### 2.@Jsonlgnore
@Jsonlgnore，作用在属性上，用来忽略此属性。

#### 3.@JsonIgnoreProperties
@JsonIgnoreProperties，忽略一组属性，作用于类上，比如JsonIgnoreProperties({ "password", "birthday" })。

#### 4.@JsonFormat
@JsonFormat，用于日期格式化，如：@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")

还有其他的一些注解，这里不再介绍可参考官方文档。

## JSON相关操作
#### JSON数组字符串-->List
**Jackson**
```java
    String jsonArray = "[{\"brand\":\"ford\"}, {\"brand\":\"Fiat\"}]";

 	ObjectMapper objectMapper = new ObjectMapper();

 	List<Car> cars1 = objectMapper.readValue(jsonArray, new TypeReference<List<Car>>(){});

```

**Fastjson**
```java
        String jsonArray = "[{\"brand\":\"ford\"}, {\"brand\":\"Fiat\"}]";

        List<Car> cars = JSON.parseArray(jsonArray, Car.class);
```

**Jackson 主要操作JSON的类是 ObjectMapper** 
**FastJson 主要操作JSON的类是 JSON、JSONObject、JSONArray**


**参考**：

 1. [Spring Boot中的JSON技术](https://mrbird.cc/Spring-Boot%20JSON.html)
 2. [Jackson使用详解](https://juejin.cn/post/6844904166809157639#heading-24)
 3. [FastJson使用详解](https://juejin.cn/post/6844904176003072007#heading-6)
