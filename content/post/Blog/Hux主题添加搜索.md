---
title: "Hux主题添加搜索"
date: 2021-04-22
author: "shuyou"
categories: ["Blog"]
tags:
    - Blog
---

>本文介绍下给hux主题添加搜索功能，主要是抄 [黄玄](https://huangxuan.me/) 的作业，可以去参考[huxpro](https://github.com/Huxpro/huxpro.github.io/)

**使用插件**：hexo-generator-search

```yaml
npm install hexo-generator-search --save
```

**配置 _config.yml**：

```yaml
search:
  path: index.json
  field: post
  limit: 50
  enable: true
```

**增加模板 search.ejs**:

```javascript
<div class="search-page">
    <div class="search-icon-close-container">
      <span class="search-icon-close">
        <i class="fa fa-chevron-down"></i>
      </span>
    </div>
    <div class="search-main container">
      <div class="row">
        <div class="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
          <form></form>
          <input type="text" id="search-input" placeholder="search: ">
          
          <div id="search-results" class="mini-post-list"></div>
        </div>
      </div>
    </div>
</div>

<script>

    $(document).ready(function () {
        var $searchPage = $('.search-page');
        var $searchOpen = $('.search-icon');
        var $searchClose = $('.search-icon-close');
        var $searchInput = $('#search-input');
        var $body = $('body');

        $searchOpen.on('click', function (e) {
            e.preventDefault();
            $searchPage.toggleClass('search-active');
            var prevClasses = $body.attr('class') || '';
            setTimeout(function () {
                $body.addClass('no-scroll');
            }, 400)

            if ($searchPage.hasClass('search-active')) {
                $searchClose.on('click', function (e) {
                    e.preventDefault();
                    $searchPage.removeClass('search-active');
                    $body.attr('class', prevClasses);  // from closure 
                });
                $searchInput.focus();
            }
            searchFunc('/index.json', 'search-input', 'search-results');
        });
    });
</script>
```

把search.ejs导入到 layout.ejs中:

```javascript
    <!-- Search -->
    <%- partial('_partial/search')%>
```

**新增search.js**:

定义 searchFunc 函数

```javascript
var searchFunc = function (path, search_id, content_id) {
    console.log("test");
    $.ajax({
        url: path,
        dataType: "json",
        success: function (datas) {
            var $input = document.getElementById(search_id);
            var $resultContent = document.getElementById(content_id);
            $input.addEventListener('input', function () {
                var keywords = this.value.trim().toLowerCase().split(/[\s\-]+/);
                var str = "";
                $resultContent.innerHTML = "";
                if (this.value.trim().length <= 0) {
                    return;
                }
                datas.forEach(function (data) {
                    var isMatch = true;
                    var content_index = [];
                    var data_title = data.title.trim().toLowerCase();
                    var data_content = data.content.trim().replace(/<[^>]+>/g, "").toLowerCase();
                    var data_url = data.url;
                    var index_title = -1;
                    var index_content = -1;
                    var first_occur = -1;
                    // only match artiles with not empty titles and contents
                    if (data_title != '' && data_content != '') {
                        keywords.forEach(function (keyword, i) {
                            index_title = data_title.indexOf(keyword);
                            index_content = data_content.indexOf(keyword);
                            if (index_title < 0 && index_content < 0) {
                                isMatch = false;
                            } else {
                                if (index_content < 0) {
                                    index_content = 0;
                                }
                                if (i == 0) {
                                    first_occur = index_content;
                                }
                            }
                        });
                    }
                    // show search results
                    if (isMatch) {
                        str += "<div class='post-preview item'><a href='" + data_url +"'>" +"<h2 class='post-title'>" + data_title +"</h2>" + "</a>";
                        var content = data.content.trim().replace(/<[^>]+>/g, "");
                        if (first_occur >= 0) {
                            // cut out 40 characters
                            var start = first_occur - 20;
                            var end = first_occur + 20;
                            if (start < 0) {
                                start = 0;
                            }
                            if (start == 0) {
                                end = 40;
                            }
                            if (end > content.length) {
                                end = content.length;
                            }
                            var match_content = content.substring(start, end);
                            // highlight all keywords
                            keywords.forEach(function (keyword) {
                                var regS = new RegExp(keyword, "gi");
                                match_content = match_content.replace(regS, "<em class=\"search-keyword\">" + keyword + "</em>");
                            });

                            str += "<p class=\"search-result\">" + match_content + "...</p><hr>"
                        }
                        str+="</div>"
                    }
                });
                $resultContent.innerHTML = str;
            });
        }
    });
}
```

**增加样式**：

抄huxpro的作业：[hux](https://huangxuan.me/)

