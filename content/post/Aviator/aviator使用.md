---
title: "Aviator的初步了解和使用"
date: 2021-01-18
author:	"shuyou"
categories: ["Code"]
---

>"初步了解和使用Aviator"

## 1.Aviator简介
Aviator 是一个高性能，轻量级的java语言实现的**表达式求值引擎**，主要用于各种表达式的动态求值。

[官方文档](https://www.yuque.com/boyan-avfmj/aviatorscript/ra28g1#f67a50b4)

[github地址](https://github.com/killme2008/aviatorscript)


>支持数字、字符串、正则表达式、布尔值、正则表达式等基本类型，完整支持所有 Java 运算符及优先级等。
函数是一等公民，支持闭包和函数式编程。
内置 bigint/decmal 类型用于大整数和高精度运算，支持运算符重载得以让这些类型使用普通的算术运算符 +-*/ 参与运算。
完整的脚本语法支持，包括多行数据、条件语句、循环语句、词法作用域和异常处理等。
函数式编程结合 Sequence 抽象，便捷处理任何集合。
轻量化的模块系统。
多种方式，方便地调用 Java 方法，完整支持 Java 脚本 API（方便从 Java 调用脚本）。
丰富的定制选项，可作为安全的语言沙箱和全功能语言使用。
轻量化，高性能，通过直接将脚本翻译成 JVM 字节码，AviatorScript 的基础性能较好。

使用场景包括：

 1. 规则判断及规则引擎
 2. 公式计算
 3. 动态脚本控制
 4. 集合数据 ELT 等 ……


## 2.Aviator入门常用
>**这里使用版本为4.2.5**

#### 2.1数据类型

 - Number类型: 数字类型,支持四种类型,分别是long,double,java.math.BigInteger(简称 big int)和java.math.BigDecimal(简 称 decimal),规则如下:
	 - 任何以大写字母 N 结尾的整数都被认为是 big int
	 - 	任何以大写字母 M 结尾的数字都被认为是 decimal
	 - 其他的任何整数都将被转换为 Long
	 - 其他任何浮点数都将被转换为 Double
	 - 超过 long 范围的整数字面量都将自动转换为 big int 类型
 - String类型: 字符串类型,单引号或者双引号括起来的文本串,如'hello world', 变量如果传入的是String或者Character也将转为String类型
 - Bool类型: 常量true和false,表示真值和假值,与 java 的Boolean.TRUE和Boolean.False对应
 -  Pattern类型: 正则表达式, 以//括起来的字符串,如/\d+/,内部 实现为java.util.Pattern
 - 变量类型: 与 Java 的变量命名规则相同,变量的值由用户传入
 - nil类型: 常量nil,类似 java 中的null,但是nil比较特殊,nil不仅可以参与==、!=的比较, 也可以参与>、>=、<、<=的比较,Aviator 规定任何类型都大于nil除了nil本身,nil==nil返回true。 用户传入的变量值如果为null,那么也将作为nil处理,nil打印为null
 
#### 2.2操作符
##### 算术运算符
Aviator 支持常见的算术运算符,包括+ - * / %五个二元运算符,和一元运算符-(负)。其中- * / %和一元的-仅能作用于Number类型。
+不仅能用于Number类型,还可以用于String的相加,或者字符串与其他对象的相加。
Aviator 规定,任何类型与String相加,结果为String。

##### 逻辑运算符
Avaitor 的支持的逻辑运算符包括,一元否定运算符!,以及逻辑与的&&,逻辑或的||。逻辑运算符的操作数只能为Boolean。
&&和||都执行短路规则。
##### 关系运算符
Aviator 支持的关系运算符包括<, <=, >, >=以及==和!= 。
关系运算符可以作用于Number之间、String之间、Pattern之间、Boolean之间、变量之间以及其他类型与nil之间的关系比较, 不同类型除了nil之外不能相互比较。

## 3.一些简单特性

```java
package aviator;

import com.googlecode.aviator.AviatorEvaluator;
import com.googlecode.aviator.Expression;
import com.googlecode.aviator.runtime.function.AbstractFunction;
import com.googlecode.aviator.runtime.function.AbstractVariadicFunction;
import com.googlecode.aviator.runtime.function.FunctionUtils;
import com.googlecode.aviator.runtime.type.AviatorDouble;
import com.googlecode.aviator.runtime.type.AviatorObject;
import com.googlecode.aviator.runtime.type.AviatorString;

import java.util.HashMap;
import java.util.Map;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-01-16 15:39
 */
public class App {
    public static void main(String[] args) {
        //执行表达式 Aviator的数值类型仅支持Long和Double, 任何整数都将转换成Long,
        // 任何浮点数都将转换为Double, 包括用户传入的变量数值
        Object execute = AviatorEvaluator.execute("1+1+2");
        System.out.println(execute.toString() + execute.getClass().getSimpleName());
        Object execute1 = AviatorEvaluator.execute("2.3+3.0");
        System.out.println(execute1.toString() + execute1.getClass().getSimpleName());

        //内置函数和 多行表达式 使用; 隔开
        Expression compile = AviatorEvaluator.getInstance().compile("println('Hello, AviatorScript!'); 1+2");
        Object res = compile.execute();
        System.out.println(res.toString());

        //使用变量
        Map<String, Object> env = new HashMap<String, Object>();
        env.put("name","zsad");
        String execute2 = (String) AviatorEvaluator.execute(" 'hello' + name", env);
        System.out.println(execute2);

        //支持函数调用
        Object execute3 = AviatorEvaluator.execute("string.length('hello')");
        System.out.println(execute3.toString());


        //支持通过 lambda 关键字定义一个匿名函数，并且支持闭包捕获
        //lambda (参数1,参数2...) -> 参数体表达式 end
        env.put("x",1);
        env.put("y",10);
        Object execute4 = AviatorEvaluator.execute("(lambda (x,y) -> x + y end)(x,y)", env);
        System.out.println(execute4.toString());

        //支持自定义函数
        AviatorEvaluator.addFunction(new AddFunction());
        AviatorEvaluator.addFunction(new GetFirstNonNullFunction());
        env.put("a",12);
        env.put("v",13);

        //参数确定 自定义函数
        System.out.println(AviatorEvaluator.execute("add(1,33)").toString());
        //参数不确定自定义函数
        System.out.println(AviatorEvaluator.execute("getFirstNonNull(a,v,bas,asf)",env));
        //lambda表达式 自定义函数
        AviatorEvaluator.defineFunction("sub","lambda (a,b) -> a - b end");
        System.out.println(AviatorEvaluator.execute("sub(12,13)").toString());
        //lambda表达式支持闭包 自定义函数  ? 按照官方写 会报错  存疑
        AviatorEvaluator.defineFunction("sub2","lambda (a) -> lambda (b) -> a - b end end");
        System.out.println(AviatorEvaluator.execute("sub2(12)(14)").toString());

    }

    //参数确定 继承 AbstractFunction
    static class AddFunction extends AbstractFunction {

        @Override
        public AviatorObject call(Map<String, Object> env, AviatorObject arg1, AviatorObject arg2) {
            Number left = FunctionUtils.getNumberValue(arg1, env);
            Number right = FunctionUtils.getNumberValue(arg2, env);
            return new AviatorDouble(left.doubleValue() + right.doubleValue());
        }

        //函数名 add
        @Override
        public String getName() {
            return "add";
        }
    }

    //参数不确定 继承 AbstractVariadicFunction
    static class GetFirstNonNullFunction extends AbstractVariadicFunction {

        @Override
        public AviatorObject variadicCall(Map<String, Object> env, AviatorObject... args) {
            if (args != null) {
                for (AviatorObject arg : args) {
                    if (arg.getValue(env) != null) {
                        return arg;
                    }
                }
            }
            return new AviatorString(null);
        }


        @Override
        public String getName() {
            return "getFirstNonNull";
        }

    }
}

```

**运行结果**
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210118160419292.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
## 4.官方函数例子(官方代码)

```java
package aviator.example;

import com.googlecode.aviator.AviatorEvaluator;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-01-18 15:59
 */
public class FunctionExample {
    public static void main(String[] args) {
        System.out.println(AviatorEvaluator.execute("sysdate()"));
        System.out.println(AviatorEvaluator.execute("rand()"));
        System.out.println(AviatorEvaluator.execute("now()"));
        System.out.println(AviatorEvaluator.execute("date_to_string(sysdate(),'yyyy-MM-dd')"));
        System.out.println(AviatorEvaluator
                .execute("string_to_date(date_to_string(sysdate(),'yyyy-MM-dd'),'yyyy-MM-dd')"));

        // string function
        System.out.println("test string function...");
        System.out.println(AviatorEvaluator.execute("string.length('hello')"));
        System.out.println(AviatorEvaluator.execute("string.contains('hello','h')"));
        System.out.println(AviatorEvaluator.execute("string.startsWith('hello','h')"));
        System.out.println(AviatorEvaluator.execute("string.endsWith('hello','llo')"));
        System.out.println(
                AviatorEvaluator.execute("string.contains(\"test\",string.substring('hello',1,2))"));
        System.out.println(Arrays
                .toString((String[]) AviatorEvaluator.execute("string.split('hello world,aviator',' ')")));

        // math function
        System.out.println("test math function...");
        System.out.println(AviatorEvaluator.execute("math.abs(-3)"));
        System.out.println(AviatorEvaluator.execute("math.pow(-3,2)"));
        System.out.println(AviatorEvaluator.execute("math.sqrt(14.0)"));
        System.out.println(AviatorEvaluator.execute("math.log(100)"));
        System.out.println(AviatorEvaluator.execute("math.log10(1000)"));
        System.out.println(AviatorEvaluator.execute("math.sin(20)"));
        System.out.println(AviatorEvaluator.execute("math.cos(99.23)"));
        System.out.println(AviatorEvaluator.execute("math.tan(19.9)"));

        // seq lib
        Map<String, Object> env = new HashMap<String, Object>();
        ArrayList<Integer> list = new ArrayList<Integer>();
        list.add(3);
        list.add(100);
        list.add(-100);
        env.put("list", list);
        System.out.println(AviatorEvaluator.execute("reduce(list,+,0)", env));
        System.out.println(AviatorEvaluator.execute("filter(list,seq.exists())", env));
        System.out.println(AviatorEvaluator.execute("count(list)", env));
        System.out.println(AviatorEvaluator.execute("include(list,100)", env));
        System.out.println(AviatorEvaluator.execute("sort(list)", env));
        System.out.println(AviatorEvaluator.execute("map(list,println)", env));
        System.out.println(list);
    }
}

```
**运行结果**

![运行结果](https://img-blog.csdnimg.cn/20210118160714133.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
## 5.支持大数据操作

```java
package aviator.example;

import com.googlecode.aviator.AviatorEvaluator;
import com.googlecode.aviator.Options;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.MathContext;
import java.util.HashMap;
import java.util.Map;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-01-18 16:10
 */
public class BigNumberExample {
    //以大写字母N为后缀的整数都被认为是big int,如1N,2N,9999999999999999999999N等, 都是big int类型。
    //超过long范围的整数字面量都将自动转换为big int类型。
    //以大写字母M为后缀的数字都被认为是decimal, 如1M,2.222M, 100000.9999M等, 都是decimal类型。
    //big int和decimal的运算,跟其他数字类型long,double没有什么区别,操作符仍然是一样的。
    // aviator重载了基本算术操作符来支持这两种新类型:
    public static void main(String[] args) {
        Object rt = AviatorEvaluator.execute("9223372036854775807100.356M * 2");
        System.out.println(rt + "  " + rt.getClass());

        rt = AviatorEvaluator.execute("92233720368547758074+1000");
        System.out.println(rt + "  " + rt.getClass());

        BigInteger a = new BigInteger(String.valueOf(Long.MAX_VALUE) + String.valueOf(Long.MAX_VALUE));
        BigDecimal b = new BigDecimal("3.2");
        BigDecimal c = new BigDecimal("9999.99999");

        Map<String, Object> env = new HashMap<String, Object>();
        env.put("a", a);
        env.put("b", b);
        env.put("c", c);

        rt = AviatorEvaluator.execute("a+10000000000000000000", env);
        System.out.println(rt + "  " + rt.getClass());

        rt = AviatorEvaluator.execute("b+c*2", env);
        System.out.println(rt + "  " + rt.getClass());

        rt = AviatorEvaluator.execute("a*b/c", env);
        System.out.println(rt + "  " + rt.getClass());

        // set math context
        AviatorEvaluator.setOption(Options.MATH_CONTEXT, MathContext.DECIMAL64);
        rt = AviatorEvaluator.execute("a*b/c", env);
        System.out.println(rt + "  " + rt.getClass());
    }
}

```
**运行结果**
![运行结果](https://img-blog.csdnimg.cn/20210118163700982.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
## 6.正则表达式匹配

```java
package aviator.example;

import com.googlecode.aviator.AviatorEvaluator;

import java.util.HashMap;
import java.util.Map;

/**
 * @author zousy
 * @version v1.0
 * @Description
 * @date 2021-01-18 16:40
 */
public class RegularExpressionExample {
    //email与正则表达式/([\\w0-8]+@\\w+[\\.\\w+]+)/通过=~操作符来匹配,结果为一个 Boolean 类 型,
    // 因此可以用于三元表达式判断,匹配成功的时候返回$1,指代正则表达式的分组 1,也就是用户名,否则返回unknown。
    //Aviator 在表达式级别支持正则表达式,通过//括起来的字符序列构成一个正则表达式,
    // 正则表达式可以用于匹配(作为=~的右操作数)、比较大小。但是匹配仅能与字符串进行匹配。
    // 匹配成功后, Aviator 会自动将匹配成功的捕获分组(capturing groups) 放入 env ${num}的变量中,
    // 其中$0 指代整个匹配的字符串,而$1表示第一个分组，$2表示第二个分组以此类推。
    //请注意，分组捕获放入 env 是默认开启的，因此如果传入的 env 不是线程安全并且被并发使用，可能存在线程安全的隐患。
    // 关闭分组匹配，可以通过 AviatorEvaluator.setOption(Options.PUT_CAPTURING_GROUPS_INTO_ENV, false);来关闭，对性能有稍许好处。
    //Aviator 的正则表达式规则跟 Java 完全一样,因为内部其实就是使用java.util.regex.Pattern做编译的。
    public static void main(final String[] args) {
        String email = "killme2008@gmail.com";
        Map<String, Object> env = new HashMap<>();
        env.put("email", email);
        String username =
                (String) AviatorEvaluator.execute("email=~/([\\w0-8]+)@\\w+[\\.\\w+]+/ ? $1:'unknow'", env);
        System.out.println(username);
    }
}

```
**运行结果**
![运行结果](https://img-blog.csdnimg.cn/20210118164657569.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
