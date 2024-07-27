---
title:      "Java类加载机制"
date:       2021-03-22
author: "shuyou"
categories: ["Code"]
tags:
    - JVM
---

>本文简单介绍Java类加载相关知识

### Java类的生命周期
一个类从被加载到虚拟机内存到卸载出虚拟机内存，它的生命周期会经历：加载、验证、准备、解析、初始化、使用、卸载这七个阶段。其中验证、准备、解析三个部分统称为连接。
![类的生命周期](https://img-blog.csdnimg.cn/20210322133225873.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
其中加载、验证、准备、初始化、卸载这五个阶段的顺序是确定的，类型的加载过程必须按这种顺序，而解析阶段却不一定，它在某些情况下可以在初始化之后再开始，这是为了支持Java语言运行时绑定特性（也称动态绑定）。

另外注意这里的几个阶段是按顺序开始，而不是按顺序进行或完成，因为这些阶段通常都是互相交叉地混合进行的，通常在一个阶段执行的过程中调用或激活另一个阶段。

### 加载
加载是整个类加载的过程中的一个阶段，在加载阶段，Java虚拟机需要完成三件事：

 1. 通过一个类的全限定名来获取定义此类的二进制字节流
 2. 将这个字节流所代表的静态存储结构转化为方法区的运行时数据结构
 3. 在内存中生成一个代表这个类的java.lang.Class对象，作为方法区这个类的各种数据的访问入口

相对于类加载的其他阶段而言，加载阶段(准确地说，是加载阶段获取类的二进制字节流的动作)是可控性最强的阶段，因为开发人员既可以使用系统提供的类加载器来完成加载，也可以自定义自己的类加载器来完成加载。

 加载阶段完成后，虚拟机外部的二进制字节流就按照虚拟机所需的格式存储在方法区之中，而且在Java堆中也创建一个java.lang.Class类的对象，这样便可以通过该对象访问方法区中的这些数据。

类加载器并不需要等到某个类被“首次主动使用”时再加载它，JVM规范允许类加载器在预料某个类将要被使用时就预先加载它，如果在预先加载的过程中遇到了.class文件缺失或存在错误，类加载器必须在程序首次主动使用该类时才报告错误(LinkageError错误)如果这个类一直没有被程序主动使用，那么类加载器就不会报告错误。

### 验证
验证是连接的第一步，这一阶段的目的是确保Class文件的字节流信息符合规范，保证这些信息被当作代码运行后不会危害虚拟机自身的安全。验证阶段大致会完成4个阶段的检验动作:

 1. 文件格式验证： 验证字节流是否符合Class文件格式的规范；例如: 是否以0xCAFEBABE开头、主次版本号是否在当前虚拟机的处理范围之内、常量池中的常量是否有不被支持的类型。
 2. 元数据验证： 对字节码描述的信息进行语义分析(注意: 对比javac编译阶段的语义分析)，以保证其描述的信息符合Java语言规范的要求；例如: 这个类是否有父类，除了java.lang.Object之外。
 3. 字节码验证：通过数据流和控制流分析，确定程序语义是合法的、符合逻辑的。
 4. 符号引用验证：确保解析动作能正确执行。

### 准备
准备阶段是正式为类中定义的变量（即静态变量， 被static修饰的变量） 分配内存并设置类变量初始值的阶段， **这些内存都将在方法区中分配。**

这时候进行内存分配的仅包括类变量(static)，而不包括实例变量，实例变量会在对象实例化时随着对象一块分配在Java堆中。

这里所设置的初始值通常情况下是数据类型默认的零值(如0、0L、null、false等)，而不是被在Java代码中被显式地赋予的值。

假设一个类变量的定义为: public static int value = 3；那么变量value在准备阶段过后的初始值为0，而不是3，因为这时候尚未开始执行任何Java方法，而把value赋值为3的put static指令是在程序编译后，存放于类构造器<clinit>()方法之中的，所以把value赋值为3的动作将在初始化阶段才会执行。

### 解析
解析阶段是虚拟机将常量池内的符号引用替换为直接引用的过程，解析动作主要针对类或接口、字段、类方法、接口方法、方法类型、方法句柄和调用点限定符7类符号引用进行。

符号引用就是一组符号来描述目标，可以是任何字面量。 

直接引用就是直接指向目标的指针、相对偏移量或一个间接定位到目标的句柄。

### 初始化
初始化为类的静态变量赋予正确的初始值，在Java中对类变量进行初始值设定有两种方式:

 - 声明类变量时指定初始化值
 - 使用静态代码块为类变量指定初始值

### 使用
类访问方法区内的数据结构， 对象是Heap区的数据。

### 卸载
Java虚拟机将结束生命周期的几种情况：

 - 执行了System.exit()方法
 - 程序正常执行结束
 - 程序在执行过程中遇到了异常或错误而异常终止
 - 由于操作系统出现错误而导致Java虚拟机进程终止

### Java类加载机制
**类加载器**
**站在Java开发人员的角度来看，类加载器可以大致划分为以下三类 :**

 1. 启动类加载器： Bootstrap ClassLoader，负责加载存放在JDK\jre\lib(JDK代表JDK的安装目录，下同)下，或被-Xbootclasspath参数指定的路径中的，并且能被虚拟机识别的类库(如rt.jar，所有的java.*开头的类均被Bootstrap ClassLoader加载)。启动类加载器是无法被Java程序直接引用的。
 2. 扩展类加载器：Extension ClassLoader，该加载器 sun.misc.Launcher$ExtClassLoader实现，它负责加载JDK\jre\lib\ext目录中，或者由java.ext.dirs系统变量指定的路径中的所有类库(如javax.*开头的类)，开发者可以直接使用扩展类加载器。
 3. 应用程序类加载器：Application ClassLoader，该类加载器由sun.misc.Launcher$AppClassLoader来实现，它负责加载用户类路径(ClassPath)所指定的类，开发者可以直接使用该类加载器，如果应用程序中没有自定义过自己的类加载器，一般情况下这个就是程序中默认的类加载器。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210322180011328.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NhcnJvdFpzeQ==,size_16,color_FFFFFF,t_70)
**寻找类加载器**

```java
package classloader;

public class ClassLoaderTest {
    public static void main(String[] args) {
        ClassLoader classLoader = ClassLoaderTest.class.getClassLoader();
        System.out.println(classLoader.toString());
        System.out.println(classLoader.getParent());
        System.out.println(classLoader.getParent().getParent());

    }
}
```
结果如下:
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210322182737715.png)
从上面的结果可以看出，当前类的加载器为AppClassLoader，它的父Loader是ExtClassLoader，并没有获取到ExtClassLoader的父Loader，原因是BootstrapLoader(引导类加载器)是用C语言实现的，找不到一个确定的返回父Loader的方式，于是就返回null。

**接着介绍下JVM的类加载机制：**
 - **全盘负责**：当一个类加载器负责加载某个Class时，该Class所依赖的和引用的其他Class也将由该类加载器负责载入，除非显示使用另外一个类加载器来载入。
 - **缓存机制**：缓存机制将会保证所有加载过的Class都会被缓存，当程序中需要使用某个Class时，类加载器先从缓存区寻找该Class，只有缓存区不存在，系统才会读取该类对应的二进制数据，并将其转换成Class对象，存入缓存区。这就是为什么修改了Class后，必须重启JVM，程序的修改才会生效。
 - **双亲委派机制**： 如果一个类加载器收到了类加载的请求，它首先不会自己去尝试加载这个类，而是把请求委托给父加载器去完成，依次向上，因此，所有的类加载请求最终都应该被传递到顶层的启动类加载器中，只有当父加载器在它的搜索范围中没有找到所需的类时，即无法完成该加载，子加载器才会尝试自己去加载该类。
	1、当AppClassLoader加载一个class时，它首先不会自己去尝试加载这个类，而是把类加载请求委派给父类加载器ExtClassLoader去完成。
	2、当ExtClassLoader加载一个class时，它首先也不会自己去尝试加载这个类，而是把类加载请求委派给BootStrapClassLoader去完成。
	3、如果BootStrapClassLoader加载失败(例如在$JAVA_HOME/jre/lib里未查找到该class)，会使用ExtClassLoader来尝试加载；
	4、若ExtClassLoader也加载失败，则会使用AppClassLoader来加载，如果AppClassLoader也加载失败，则会报出异常ClassNotFoundException。

>这里的父类并不是继承关系，而是一种组合关系。

**类加载器的默认加载路径**

|类加载器|加载路径 |
|-----|-----|
| Bootstrap ClassLoader   | 由系统属性sun.boot.class.path指定，通常是$JAVA_HOME/jre/lib |
| Extension ClassLoader   | 通常是$JAVA_HOMEx/jre/lib/ext，可通过系统属性java.ext.dirs查看路径  |
| Application ClassLoader | 通常是当前路径下的Class文件，可通过系统属性java.class.path查看 |

**双亲委托加载方向**

<font color=#00f >类加载器在加载类时，只能向上递归委托其双亲进行类加载，而不可能从双亲再反向委派当前类加载器来进行类加载。</font>

**双亲委派优势**

 - 系统类防止内存中出现多份同样的字节码
 - 保证Java程序安全稳定运行


**参考**

 1. 深入理解Java虚拟机
 2. [JVM 基础 - Java 类加载机制](https://www.pdai.tech/md/java/jvm/java-jvm-classload.html#%E7%B1%BB%E5%8A%A0%E8%BD%BD%E5%99%A8-jvm%E7%B1%BB%E5%8A%A0%E8%BD%BD%E6%9C%BA%E5%88%B6)
