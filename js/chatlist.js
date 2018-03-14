﻿;(function(global,factory){
    if(typeof define==='function' && define.amd){
    	define([],factory);
    }else if(typeof module!='undefined' && module.exports){
    	module.exports=factory();
    }else{
    	global.ChatList=factory();
    }
})(this,function(){
    function getObjById(id){
       return document.getElementById(id);
    }
    function isEmpty(str){
    	var empty=/^\s*$/;
    	return empty.test(str);
    }
    var $input=null;
    var $listContainer=null;
    var $scroller=getObjById('msg');
    var socket=null;
    var scrollerH=0;

    var realScrollH=0,m=Math,        
        nextFrame = (function () {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (callback) { return setTimeout(callback, 1); };
        })(),
        cancelFrame = (function () {
            return window.cancelRequestAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.webkitCancelRequestAnimationFrame ||
                window.mozCancelRequestAnimationFrame ||
                window.oCancelRequestAnimationFrame ||
                window.msCancelRequestAnimationFrame ||
                clearTimeout;
        })();
    var transitionDuration='transitionDuration';

    var $footer=getObjById('footer'),$change=getObjById('change');
    var $voice=getObjById('voice');
    var TOUCH_START="touchstart",TOUCH_MOVE="touchmove",TOUCH_END="touchend",
        TRNEND_EV = 'transitionend';

    var showVirtual=false;//是否显示虚拟的box;
    var $virtual=getObjById('virtual-box');//虚拟wrapper
    var $virtualList=getObjById('virtualList');

     var winWidth=window.innerWidth;
     var winHeight=window.innerHeight;
     var $show=getObjById('show');
    function ChatList(options){
         var _this=this;
         this.$btn=getObjById('submit');//发送按钮
         $listContainer=getObjById('list');//消息容器
         $input=document.querySelector(".footer input");

          var loc = document.location;
          var protocolStr = loc.protocol;
          var wsProtocl = "ws:";
          if(protocolStr == "https:"){
              wsProtocl = "wss:";
          }
        var address = wsProtocl + loc.host + window.context+'/ws/api/chatbot';
        //"ws://172.20.71.86:8888/rest/ws/api/test"
        socket=new Socket(address);
	      socket.setEventCallBack("onmessage",this.acceptMsg.bind(this))
        socket.open(false,function(){
            if(window.message && !isEmpty(window.message)){
               _this.mode=1; 
               _this.shouldShowVirtual();
               _this.sendMessage(window.message);
               _this.mode=0;
           }
        });
        $scroller.style['transitionDuration']="0";
        $scroller.style['transformOrigin']="0 0";
        $scroller.style['transitionTimingFunction'] = 'cubic-bezier(0.33,0.66,0.66,1)';
        this.init();
    }
    ChatList.prototype={
        x:0,
        y:0,
        mode:0,//输入的模式 0：文字输入  1：语音输入,
        imgArr:null,
        html:"",
        options:{
            useTransform:true,
            bounce:true,
            topOffset:0,
            bounceLock:true,
            hScroll:true,
            vScroll:true,
            useTransition:true

        },
        handleEvent:function(e){
           var type=e.type;
           switch(type){
              case TOUCH_START:
                  this.start(e)
              break;
              case TOUCH_MOVE:
                  this.move(e);
              break;
              case TOUCH_END:
                  this.end(e)
              break;
              case TRNEND_EV: 
                  this._transitionEnd(e); 
              break;
           }
        },
        _transitionEnd:function(e){
            var that = this;

            if (e.target != $scroller) return;

            that.unbindEvent($scroller,TRNEND_EV);

            that._startAni();
        },
        start:function(e){
             var pointer=e.touches[0] || e;
             var that=this;
              that.moved = false;
              that.animating = false;

              if (that.options.useTransition) that._transitionTime(0);
             
             that.distX=0;
             that.distY=0;

             that.dirX=0;
             that.dirY=0;

             that.startX=that.x;
             that.startY=that.y;
             that.pointX=pointer.pageX;
             that.pointY=pointer.pageY;

             that.startTime=e.timeStamp || Date.now();
             this.bindEvent($scroller,TOUCH_MOVE);
             this.bindEvent($scroller,TOUCH_END);
             //页面滚动时input失去焦点
             $input.blur();
        },
        move:function(e){
             var that=this;
             var pointer=e.touches[0]||e,
                 deltaX=pointer.pageX - this.pointX,
                 deltaY=pointer.pageY - this.pointY,
                 newX=that.x + deltaX,
                 newY=that.y + deltaY,
                 timestamp=e.timeStamp || Date.now();

              this.pointX=pointer.pageX;
              this.pointY=pointer.pageY;
              
              this.distX+=deltaX;
              this.distY+=deltaY;
              this.absDistX=Math.abs(this.distX);
              this.absDistY=Math.abs(this.distY);

              if(this.absDistY > this.absDistX + 5){
                  newX=this.x;
                  deltaX=0;
              }else if(this.absDistX > this.absDistY + 5){
                  newY=this.y;
                  deltaY=0;
              }
              this.moved=true;
              console.log("move"+newX+" and nweY is "+newY);
              this._pos(newX,newY);
              this.dirX=deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
              this.dirY=deltaY > 0 ? 1 : deltaY < 0 ? 1 : 0;

              if(timestamp - this.startTime > 300){
                  this.startTime=timestamp;
                  this.startX=this.x;
                  this.startY=this.y;
              }


        },
        end:function(e){
            var that = this,
                point = e.changedTouches[0] || e,
                target, ev,
                momentumX = { dist: 0, time: 0 },
                momentumY = { dist: 0, time: 0 },
                duration = (e.timeStamp || Date.now()) - that.startTime,
                newPosX = that.x,
                newPosY = that.y,
                distX, distY,
                newDuration;
            this.unbindEvent($scroller,TOUCH_MOVE);
            this.unbindEvent($scroller,TOUCH_END);
            if (duration < 300) {
                momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
                momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y - that.minScrollY : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;

                newPosX = that.x + momentumX.dist;
                newPosY = that.y + momentumY.dist;

                if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = { dist: 0, time: 0 };
                if ((that.y > that.minScrollY && newPosY > that.minScrollY) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = { dist: 0, time: 0 };
            }

            if (momentumX.dist || momentumY.dist) {
                newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);

                // Do we need to snap?
                if (that.options.snap) {
                    distX = newPosX - that.absStartX;
                    distY = newPosY - that.absStartY;
                    if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) { that.scrollTo(that.absStartX, that.absStartY, 200); }
                    else {
                        snap = that._snap(newPosX, newPosY);
                        newPosX = snap.x;
                        newPosY = snap.y;
                        newDuration = m.max(snap.time, newDuration);
                    }
                }

                that.scrollTo(m.round(newPosX), m.round(newPosY), newDuration);
                return;
            }   
            that._resetPos(100);
        },
        _resetPos: function (time) {
            var that = this,
                resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
                resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

            if (resetX == that.x && resetY == that.y) {
                if (that.moved) {
                    that.moved = false;
                    if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);      // Execute custom code on scroll end
                }

                return;
            }

            that.scrollTo(resetX, resetY, time || 0);
        },
        scrollTo: function (x, y, time, relative) {
            var that = this,
                step = x,
                i, l;

            that.stop();

            if (!step.length) step = [{ x: x, y: y, time: time, relative: relative }];

            for (i = 0, l = step.length; i < l; i++) {
                if (step[i].relative) { step[i].x = that.x - step[i].x; step[i].y = that.y - step[i].y; }
                that.steps.push({ x: step[i].x, y: step[i].y, time: step[i].time || 0 });
            }

            that._startAni();
        },
        _startAni: function () {
            var that = this,
                startX = that.x, startY = that.y,
                startTime = Date.now(),
                step, easeOut,
                animate;
        
            if (that.animating) return;

            if (!that.steps.length) {
                that._resetPos(400);
                return;
            }

            step = that.steps.shift();

            if (step.x == startX && step.y == startY) step.time = 0;

            that.animating = true;
            that.moved = true;

            if (that.options.useTransition) {
                that._transitionTime(step.time);
                console.log('_startAni');
                that._pos(step.x, step.y);
                that.animating = false;
                if (step.time) that.bindEvent($scroller,TRNEND_EV);
                else that._resetPos(0);
                return;
            }

            animate = function () {
                var now = Date.now(),
                    newX, newY;

                if (now >= startTime + step.time) {
                    console.log("_startAni animate");
                    that._pos(step.x, step.y);
                    that.animating = false;
                    if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that);            // Execute custom code on animation end
                    that._startAni();
                    return;
                }

                now = (now - startTime) / step.time - 1;
                easeOut = m.sqrt(1 - now * now);
                newX = (step.x - startX) * easeOut + startX;
                newY = (step.y - startY) * easeOut + startY;
                console.log("_startAni animate2");
                that._pos(newX, newY);
                console.log("animating is "+that.animating);
                if (that.animating) that.aniTime = nextFrame(animate);
            };

            animate();
        },
        _transitionTime: function (time) {
            time += 'ms';
            console.log("time is "+time);
            $scroller.style['transitionDuration'] = time;
            // if (this.hScrollbar) this.hScrollbarIndicator.style[transitionDuration] = time;
            // if (this.vScrollbar) this.vScrollbarIndicator.style[transitionDuration] = time;
        },
        loadImg:function(srcArr){
          srcArr.forEach(function(item){
            var img=new Image();
            img.src=item;
            if(img.complete){
              return;
            }
            img.onload=function(){
              console.log("图片加载成功!");
            }
            img.onerror=function(){
              console.error("加载图片出错啦!");
            }
          })
        },
        stop: function () {
            if (this.options.useTransition) this.unbindEvent($scroller,TRNEND_EV);//this._unbind(TRNEND_EV);
            else cancelFrame(this.aniTime);
            this.steps = [];
            this.moved = false;
            this.animating = false;
        },
        init:function(){
            var _this=this;
            // this.html=localStorage.getItem('htmlContent');
            // if(!isEmpty(this.html)){
            //   $listContainer.innerHTML=this.html;
            //   localStorage.setItem('htmlContent','');
            //   this.jump();
            // }

            // XuntongJSBridge.call('defback', {}, function () {
            //     if (history.length <= 1) { //顶级页面，则关闭当前Web
            //             localStorage.setItem('htmlContent','');
            //             XuntongJSBridge.call('closeWebView');
                
            //         } else {
            //             localStorage.setItem('htmlContent','');
            //             history.back();
            //         }
               
            // })

            scrollerH=this.wrapperH=document.body.clientHeight - 44;
            this.wrapperW=document.body.clientWidth;
            this.imgArr=[
                window.avatar || 'http://static.yunzhijia.com/space/c/photo/load?id=58a69bede4b06875aef77505&spec=80',
                '../static/chatbot/server.png'
            ]
            this.loadImg(this.imgArr);
            if(this.$btn){
                this.bindEvent(this.$btn,'click',this.sendMessage.bind(this))
            }
            if($input){
                var bfscrolltop;
                this.bindEvent($input,"keyup",function(e){
                     e.preventDefault();
                     if(e.keyCode==13){
                        _this.sendMessage();
                     }
                })
                this.bindEvent($input,"focus",function(e){
                  setTimeout(function(){
                       _this.inputIsNotInView =_this.solutionThree();
                      $input.value=$input.value +" "+_this.inputIsNotInView;
                      if (_this.inputIsNotInView) {
                            // Width, Height: 分别是键盘没有弹出时window.innerWidth和window.innerHeight
                            // 88: 是第三方输入法比原生输入法多的那个tool bar(输入时显示带选项) 的高度, 做的不是太绝, 高度是统一的
                            // ios第三方输入法的tool bar 甚至 键盘也被当作可视区域了(包含在键盘弹出时的window.innerHeight)
                          if (winWidth != 750) {
                              var bottomAdjust = (winHeight - window.innerHeight - 88) + 'px'
                             // $(this.inputBoxContainer).css('bottom', bottomAdjust)
                             $show.innerHTML="first "+bottomAdjust;
                             $footer.style['bottom']=bottomAdjust;
                          }
                          else {
                                // 'iphone 6 6s, 需要额外减去键盘高度432(见下图), 还算有良心, 高度和原生保持一致')
                              var bottomAdjust = (winHeight - window.innerHeight - 88 - 432) + 'px'
                              //$(this.inputBoxContainer).css('bottom', bottomAdjust)
                              $show.innerHTML="next "+bottomAdjust;
                              $footer.style['bottom']=bottomAdjust;
                          }
                      }
                      // _this.scrollIntoViewWhenFocus();
                      //解决第三方软键盘唤起时底部input输入框被遮挡问题
                      //_this.solutionOne();
                      //_this.solutionTwo();
                      _this.shouldShowVirtual();
                  },300);
                })
                this.bindEvent($input,"blur",function(e){
                  clearInterval(_this.timer);//清除计时器
                  //document.body.scrollTop = bfscrolltop;//将软键盘唤起前的浏览器滚动部分高度重新赋给改变后的高度
                  showVirtual=false;
                  $virtual.style['visibility']="hidden";
                })
            }
            this.refresh();
            this.bindEvent($voice,'click',this.speak.bind(this));
            //切换
            this.bindEvent($change,'click',function(e){
               var target=e.target;
               if(target.classList.contains('icon-voice')){
                  target.classList.remove('icon-voice');
                  target.classList.add('icon-voice-text');
               }else if(target.classList.contains('icon-voice-text')){
                  target.classList.remove('icon-voice-text');
                  target.classList.add('icon-voice');
               }

               if($footer.classList.contains("change-lt")){
                
                   $footer.classList.remove("change-lt");
                   $footer.classList.add("change-v");
                   this.mode=1;//语音
               }else if($footer.classList.contains('change-v')){
                   $footer.classList.remove("change-v");
                   $footer.classList.add("change-lt");
                   this.mode=0;//文字
               }
            })
            this.bindEvent($scroller,TOUCH_START);

        },
        //是否应该显示虚拟框
        shouldShowVirtual:function(){
            var boardScrollH=document.body.scrollTop;//input获取焦点页面被推上的高度
            var containerH=$listContainer.clientHeight;
            //$input.value="scrollis "+boardScrollH+" and listContainer "+containerH;
            if((parseInt(containerH) + 30) < boardScrollH){
              if($input==document.activeElement){
                 showVirtual=true;
                 $virtual.style['visibility']="visible";
              }
            }
        },
        acceptMsg:function(data){
            var data = JSON.parse(data);
            var LI=document.createElement('LI');
            LI.classList.add('msg-item');
            var urlText="";
            if(data.type=='URL'){
               var urlContent=data.url;
               urlText="<div class='url-wrapper' data-url="+urlContent.url+"><span class='url-title'>"+urlContent.title+"</span><span class='url-content'>"
               +urlContent.content+"</span></div>"
            }
            var inerText=urlText + '<div class="message new"><figure class="avatar left-avatar"><img src='+this.imgArr[1]+'  /></figure>' + data.text + '</div>'
            LI.innerHTML=inerText;
            var cloneNode=LI.cloneNode();
            cloneNode.innerHTML=inerText;
            $listContainer.appendChild(LI);
            if(showVirtual || !isEmpty(window.message)){
              $virtualList.appendChild(cloneNode);
              window.message="";
            }
            this.jump();
            this.refresh();
            this.scroll();
            this.html+="<li class='msg-item'>"+inerText+"</li>"
        },
        //页面内点击跳转
        jump:function(){
          var _this=this;
           var urlWrapper=document.querySelectorAll(".url-wrapper");
           console.log("length is "+urlWrapper.length);
           for(var i=0,len=urlWrapper.length;i<len;i++){
               this.bindEvent(urlWrapper[i],'click',function(e){
                   var target=e.target;
                   console.log("node name is "+target.nodeName);
                   if(target.nodeName!='DIV'){
                     target=target.parentNode;
                   }
                   var url=target.getAttribute('data-url');
                   if(url){
                     // localStorage.setItem("htmlContent",_this.html);
                      location.href=url;
                   }
               })
           }
        },
        scroll:function(){
            this.caculate();
            if(realScrollH > scrollerH){
                var scrollTop=scrollerH - realScrollH;
                //$listContainer.style['transform']="tranlate3d(0,"+scrollTop+"px,0)"
                this._pos(0,scrollTop);
            }
        },
        caculate:function(){
            realScrollH=$scroller.scrollHeight;
        },
        refresh:function(){
            this.scrollerW=m.abs($listContainer.offsetWidth);
            this.scrollerH=m.abs($listContainer.offsetHeight);
            this.minScrollY = -this.options.topOffset || 0;
            this.maxScrollX = this.wrapperW - this.scrollerW;
            this.maxScrollY = this.wrapperH - this.scrollerH + this.minScrollY;

            this.hScroll = this.options.hScroll && this.maxScrollX < 0;
            this.vScroll = this.options.vScroll && (!this.options.bounceLock && !this.hScroll || this.scrollerH > this.wrapperH);
        },
        clearInput:function(){
            $input.value="";
        },
        //接收结果后
        speakCallBack:function(data){
            alert(data.resultStr); 
            this.sendMessage(data.resultStr);
        },
        //调用云之家语音接口
        speak:function(callback){
          var _this=this;
          if(!navigator.userAgent.match(/Qing\/.*;(iOS|iPhone|Android).*/)){
              alert("请用云之家打开!");
              return;
          }
           // try{
           //  //voiceRecognize   
           //   XuntongJSBridge.call('voiceAssistant',{
           //      'recommendLabelArr':['测试数据'],
           //      'recommendButtonArr':[],
           //      'imageStr':''
           //   },function(result){
           //       if(result['success']=='true'){
           //           _this.sendMessage(result.data.resultStr);
           //       }else{
           //          alert("error is "+result.error);
           //       }
           //   })
           // }catch(e){
           //    alert("speak is "+e);
           // }
           try{
                 XuntongJSBridge.call('voiceRecognize',{

                 },function(result){
                     alert("result is "+JSON.stringify(result));
                     if(result['success']=='true'){
                         _this.sendMessage(result.data.text);
                     }
                 })
           }catch(e){

           }
        },
        sendMessage:function(content){
            if(this.mode==0){//文字输入
               content=$input.value;
               if(isEmpty(content)){
                  return;
               }
            } 
             this.insertMsg(0,content);
             socket.send(JSON.stringify({sessionId:window.chatSessionId,message:content}));
             //清空输入框
             this.clearInput();
             this.refresh();
             this.scroll();
        },
        setDate:function(){
            var d=new Date();
            var timeDIV=document.createElement('DIV');
            timeDIV.innerHTML=d.getHours()+":"+d.getMinutes();
            return timeDIV;
        },
        //显示消息到界面  type:用户问（显示在界面左边）：0  系统答(内容显示在界面右边):1  ,content:消息内容
        insertMsg:function(type,content){
           var LI=document.createElement('LI');
           LI.classList.add('msg-item');
           //https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg
           var inText='<div class="message message-personal"><figure class="avatar right-avatar"><img src='+this.imgArr[0]+' /></figure>'+content+'</div>'
           LI.innerHTML=inText;
           var cloneNode=LI.cloneNode();
           cloneNode.innerHTML=inText;
           $listContainer.appendChild(LI);
           if(showVirtual || !isEmpty(window.message)){
             $virtualList.appendChild(cloneNode);
           }
           this.html+="<li class='msg-item'>"+inText+"</li>";
        },
        bindEvent:function(obj,eventName,callback){
           obj.addEventListener(eventName,callback || this,false);
        },
        unbindEvent:function(obj,eventName,callback){
           obj.removeEventListener(eventName,callback || this,false);
        },
        _pos: function (x, y) {
            console.log("this.hScroll is "+this.hScroll+" and vScroll is "+this.vScroll);
             x = this.hScroll ? x : 0;
             y = this.vScroll ? y : 0;

            if (this.options.useTransform) {
                console.log("test");
                $scroller.style['-webkit-transform'] = 'translate(' + x + 'px,' + y + 'px)';
            } else {
                x = m.round(x);
                y = m.round(y);
                $scroller.style.left = x + 'px';
                $scroller.style.top = y + 'px';
            }

            this.x = x;
            this.y = y;
        },
        _momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
            var deceleration = 0.0006,
                speed = Math.abs(dist) / time,
                newDist = (speed * speed) / (2 * deceleration),
                newTime = 0, outsideDist = 0;

            // Proportinally reduce speed if we are outside of the boundaries
            if (dist > 0 && newDist > maxDistUpper) {
                outsideDist = size / (6 / (newDist / speed * deceleration));
                maxDistUpper = maxDistUpper + outsideDist;
                speed = speed * maxDistUpper / newDist;
                newDist = maxDistUpper;
            } else if (dist < 0 && newDist > maxDistLower) {
                outsideDist = size / (6 / (newDist / speed * deceleration));
                maxDistLower = maxDistLower + outsideDist;
                speed = speed * maxDistLower / newDist;
                newDist = maxDistLower;
            }
            newDist = newDist * (dist < 0 ? -1 : 1);
            newTime = speed / deceleration;
            return { dist: newDist, time: Math.round(newTime) };
        },
        notInView:function(){
          var bottom=$footer.getBoundingClientRect().bottom;
          $input.value=bottom +" "+window.innerHeight+" and winHeight";
          if(window.innerHeight - bottom <= 0){
             return true;
          }
          return false;
        },
        //解决iOS 11键盘遮挡输入框的BUG
        solutionOne:function(){
            var str = navigator.userAgent.toLowerCase();
            var ver = str.match(/cpu iphone os (.*?) like mac os/)[1].replace(/_/g,".");
            var oc = ver.split('.')[0];
            $input.value=oc;
            if(oc > 10){
                // ios11 不做处理
                     this.timer = setInterval(function() {
                    $input.value='输入框获取到焦点';
                    document.body.scrollTop = document.body.scrollHeight;
                }, 100);
               // return true;
            }else{
                this.timer = setInterval(function() {
                    $input.value='输入框获取到焦点';
                    document.body.scrollTop = document.body.scrollHeight;
                }, 100);
            }
        },
        solutionTwo:function(){
            //if(/Android/.test(navigator.appVersion)) {
               if(document.activeElement.scrollIntoViewIfNeeded){
                   $input.value="support!"
                   $footer.scrollIntoViewIfNeeded();
               }
               //ios不会触发resize事件
               // window.addEventListener("resize", function() {
               //      if(document.activeElement.tagName=="INPUT" || document.activeElement.tagName=="TEXTAREA") {
               //           window.setTimeout(function() {
               //               document.activeElement.scrollIntoViewIfNeeded && document.activeElement.scrollIntoViewIfNeeded();
               //           },0);
               //       }
               //   })
           // }
        },
        solutionThree:function(){
            // getBoundingClientRect 是获取定位的，很怪异, (iphone 6s 10.0 bate版表现特殊)
            // top: 元素顶部到窗口（可是区域）顶部
            // bottom: 元素底部到窗口顶部
            // left: 元素左侧到窗口左侧
            // right: 元素右侧到窗口左侧
            // width/height 元素宽高
               $input.value=JSON.stringify($footer.getBoundingClientRect());
               var bottom = $footer.getBoundingClientRect().bottom
              // $input.value=bottom;
               // 可视区域高度 - 元素底部到窗口顶部的高度 < 0, 则说明被键盘挡住了
            if (window.innerHeight - bottom < 0) {
                $input.value="挡住了";
                return true
            }
            return false
        }
    }
    return ChatList;
})















        // //通过scrollIntoViewIfNeeded来将不在可视区域内的元素滚动至可视区域，如在可视区域则不滚动
        // solutionTwo:function(){
        //     //if(/Android/.test(navigator.appVersion)) {
        //        if(document.activeElement.scrollIntoViewIfNeeded){
        //            $input.value="support!"
        //            $footer.scrollIntoViewIfNeeded();
        //        }
        //        //ios不会触发resize事件
        //        window.addEventListener("resize", function() {
        //             if(document.activeElement.tagName=="INPUT" || document.activeElement.tagName=="TEXTAREA") {
        //                  window.setTimeout(function() {
        //                      document.activeElement.scrollIntoViewIfNeeded && document.activeElement.scrollIntoViewIfNeeded();
        //                  },0);
        //              }
        //          })
        //    // }
        // },
        // //
        // solutionThree:function(){
        //     // getBoundingClientRect 是获取定位的，很怪异, (iphone 6s 10.0 bate版表现特殊)
        //     // top: 元素顶部到窗口（可是区域）顶部
        //     // bottom: 元素底部到窗口顶部
        //     // left: 元素左侧到窗口左侧
        //     // right: 元素右侧到窗口左侧
        //     // width/height 元素宽高
        //        $input.value=JSON.stringify($footer.getBoundingClientRect())
        //        let bottom = $footer.getBoundingClientRect().bottom
        //       // $input.value=bottom;
        //        // 可视区域高度 - 元素底部到窗口顶部的高度 < 0, 则说明被键盘挡住了
        //     if (window.innerHeight - bottom < 0) {
        //         $input.value="挡住了";
        //         return true
        //     }
        //     return false
        // }