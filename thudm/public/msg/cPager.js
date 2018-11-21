/**
* PC端列表分页插件 供客户端分页用
* author:stepday
* date:2018-01-01
* 调用示例
  $(this).cPager({
      pageSize: 8, //每一页显示的记录条数
      pageid: "pager", //分页容器ID
      itemClass: "li-item" //个体元素名称
  });
*/
(function ($) {
    /**
        * 严格模式
        */
    "use strict";

    //扩展jQuery的函数
    $.fn.cPager = function (config) {
        var defaultConfig = {            
            pageSize: 8,//每页显示记录数
            pageCount: 1,//页码总数
            pageIndex: 1,//当前页码
            pageid: "pageing",//显示分页按钮的容器ID 
            total: 0,//数据记录总数
            itemClass:"" //个体元素样式名称
        };
        //合并config配置
        var _config = $.extend({}, defaultConfig, config);

        //构建内部类
        this.Run = function (config) {            
            var C = this;  
            /**
            * 显示对应分页段的元素
            */          
            this.show = function(){
              $("."+config.itemClass).hide();
              for(var i = 0;i<config.pageSize;i++)
              {
                $("."+config.itemClass).eq((config.pageIndex-1)*config.pageSize+i).show();            
              }
            };
            /**
            * ajax获取接口数据
            */
            this.get = function () {
                var _inThis = this;  
                //获取对象总数
                config.total = $("."+config.itemClass).length;
                //获得总页数               
                config.pageCount = parseInt(config.total / config.pageSize) + (config.total % config.pageSize > 0 ? 1 : 0);               
                //默认显示
                this.show();  
                _inThis.createPage();
            },
            /**
            * 创建分页
            */
           this.createPage = function () {
               if (config.total == 0) {
                   $("#" + config.showid).html("");
                   $("#" + config.pageid).css({"float":"none","text-align":"center"});
                   $("#" + config.pageid).html('<div class="loading">暂无任何记录</div>');
                   return;
               }else
               {
                  $("#" + config.pageid).css({"float":"right","text-align":"center"});
               }
               var html = '<div class="turn-num">共有'+config.total+'条，每页显示'+config.pageSize+'条</div>';
               html += '<ul class="turn-ul">';
               //首页+上一页
               html += '<li class="tz first"><<</li>';
               if(config.pageIndex > 1)
                  html += '<li class="tz prev"><</li>';
               else
                  html += '<li class="tz prev"><</li>';

               //小于6页 全部显示
               if(config.pageIndex <= 6)
               {
                   if(config.pageCount <= 6)
                        for(var i = 1;i<=config.pageCount;i++)
                        {
                            if(i == config.pageIndex)
                                html +='<li class="on">' + i + '</li>';
                            else
                                html +='<li class="">' + i + '</li>';
                        }
                   else
                   {
                       //前4个
                       for(var i = 1;i<=6;i++)
                       {
                           if(i == config.pageIndex)
                               html +='<li class="on">' + i + '</li>';
                           else
                               html +='<li class="">' + i + '</li>';
                       }
                       html +='<i>...</i>';
                       html +='<li class="">' + config.pageCount + '</li>';
                   }
               }else if((config.pageIndex + 3) < config.pageCount)
               {
                    //三个部分
                   //头部
                   html +='<li class="">1</li>';
                   html +='<i>...</i>';
                   //中部
                    //加载中间5个
                   for(var i = config.pageIndex-2;i<config.pageIndex+2;i++)
                   {
                       if(i == config.pageIndex)
                           html +='<li class="on">' + i + '</li>';
                       else
                           html +='<li class="">' + i + '</li>';
                   }
                   //尾部
                   html +='<i>...</i>';
                   html +='<li class="">' + config.pageCount + '</li>';
               }else
               {
                   //头部
                   html +='<li class="">1</li>';
                   html +='<i>...</i>';
                   //尾部 5个
                   for(var i = config.pageCount-4;i<=config.pageCount;i++)
                   {
                       if(i == config.pageIndex)
                           html +='<li class="on">' + i + '</li>';
                       else
                           html +='<li class="">' + i + '</li>';
                   }
               }
              
               //下一页+尾页
               if(config.pageIndex < config.pageCount)
                 html += '<li class="tz next">></li>';
               else
                 html += '<li class="tz next">></li>';

               html += '<li class="tz end">>></li>';                            

               $("#" + config.pageid).html(html);
               //标记最大页数
               $("#"+config.pageid).attr("data-pagecount",config.pageCount);

               this.bindEvent();
            },
            /**
            * 绑定分页元素点击事件
            */
            this.bindEvent = function(){
              var _inThis = this;
              $("#"+config.pageid).find("ul li").click(function(){
                  var _curPage = $("#"+config.pageid).find("li.on").text()*1,
                      _totalPage = $("#"+config.pageid).data("pagecount");
                  //判断当前点击的是什么标签
                  if($(this).attr('class').indexOf("first") > -1)
                  {
                    //首页
                    config.pageIndex = 1;                   
                  }else if($(this).attr('class').indexOf("prev") > -1)
                  {
                    //上一页
                    if(_curPage > 1)
                      config.pageIndex--;
                  }else if($(this).attr('class').indexOf("next") > -1)
                  {
                    //下一页
                    if(_curPage < _totalPage)
                      config.pageIndex++;
                  }else if($(this).attr('class').indexOf("end") > -1)
                  {
                    //末页
                    config.pageIndex = _totalPage;                  
                  }else if(!isNaN($(this).text()))
                  {
                    config.pageIndex = $(this).text()*1;
                  }
                  _inThis.show();
                  _inThis.createPage();                 
              }); 
            };
            /**
            * 参数初始化以及初始数据获取
            */
            this.init = function () {
                this.get();
            };

            this.init();
        };
        var C = this;
        /**
        * 遍历对象进入初始化任务
        * 这里return也是为了保证链式调用  
        * 并且each方法会遍历所有DOM对象，使得我们可以单个处理包装集中的所有DOM对象
        **/
        return this.each(function () {
            _config.target = this;
            C.Run(_config);
        });
    };
})(jQuery);