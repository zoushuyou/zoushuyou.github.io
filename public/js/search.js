var searchFunc = function (path, search_id, content_id) {
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
                    }else {
                        isMatch = false;
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