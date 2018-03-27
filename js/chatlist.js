;(function(global,factory){
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
    $}
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

    var $footer=getObjById('footer'),$change=getObjById('change'),$changeVoice=getObjById('changeVoice');
    var $voice=getObjById('voice');
    var TOUCH_START="touchstart",TOUCH_MOVE="touchmove",TOUCH_END="touchend",
        TRNEND_EV = 'transitionend';

    var showVirtual=false;//是否显示虚拟的box;
    var $virtual=getObjById('virtual-box');//虚拟wrapper
    var $virtualList=getObjById('virtualList');
    var $scoketTip=getObjById('socket_tip');//用来提示websocket的状态
    window.scoketTip=$scoketTip;
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
        window.message="明天从深圳到北京出差后天返回";
        //alert("window.mesage is "+window.message);
        var options={
          domObj:$scoketTip
        }
        socket=new Socket(address,'',options);
	      socket.setEventCallBack("onmessage",this.acceptMsg.bind(this))
        socket.open(false,function(){
            if(window.message && !isEmpty(window.message)){
               var chatSessionId=localStorage.getItem('chatSessionId');
               console.log("chatSessionId is "+chatSessionId);
               //if(chatSessionId || !isEmpty(chatSessionId)){
                  
               //}else{
                   _this.mode=1; 
                   _this.shouldShowVirtual();
                   _this.sendMessage(window.message);
                   _this.mode=0;
               //}
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
        urlText:'',
        localId:0,//云之家语音播报
        voiceText:'',//云之家语音播报
        bindEvents:[],//事件列表，主要放已经绑定事件的对象 {'obj':obj,eventName:'click',callBack:fn}
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
                that._pos(newX, newY);
                if (that.animating) that.aniTime = nextFrame(animate);
            };

            animate();
        },
        _transitionTime: function (time) {
            time += 'ms';
            $scroller.style['transitionDuration'] = time;
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
            this.html=localStorage.getItem('htmlContent');
            var chatSessionId=localStorage.getItem('chatSessionId');
            if(chatSessionId && !isEmpty(chatSessionId) && chatSessionId!='0'){
                window.chatSessionId=localStorage.getItem('chatSessionId');
                localStorage.removeItem('chatSessionId');
            }
            if(!isEmpty(this.html)){
              $listContainer.innerHTML=this.html;
              localStorage.setItem('htmlContent','');
              localStorage.removeItem('chatSessionId');
              this.jump();
            }

            XuntongJSBridge.call('defback', {}, function () {
                //if (history.length <= 1) { //顶级页面，则关闭当前Web
                        localStorage.setItem('htmlContent','');
                        localStorage.removeItem('chatSessionId');
                        XuntongJSBridge.call('closeWebView');
                
                   // } else {
                       // localStorage.removeItem('chatSessionId');
                      //  localStorage.setItem('htmlContent','');
                      //  history.back();
                   // }
               
            })

            scrollerH=this.wrapperH=document.body.clientHeight - 44;
            this.wrapperW=document.body.clientWidth;
            this.imgArr=[
                window.avatar || 'http://static.yunzhijia.com/space/c/photo/load?id=58a69bede4b06875aef77505&spec=80',
                '../static/chatbot/server.png'
            ]
           // this.loadImg(this.imgArr);
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
            this.bindEvent($changeVoice,'click',function(e){
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
                 //showVirtual=true;
                 $virtual.style['visibility']="visible";
              }
            }
        },
        acceptMsg:function(data){
            console.log("data is "+data)
            var data = JSON.parse(data);

            var LI=document.createElement('LI');
            LI.classList.add('msg-item');
            //var urlText="";
            //this.urlText=
            this.dealType(data);
            //<figure class="avatar left-avatar"><img src='+this.imgArr[1]+'  /></figure>
            //var inerText=urlText + '<div class="message new">' + data.text + '</div>'
            LI.innerHTML=this.urlText;//inerText;
            var cloneNode=LI.cloneNode();
            cloneNode.innerHTML=this.urlText;//inerText;
            $listContainer.appendChild(LI);
            if(showVirtual || !isEmpty(window.message)){
              $virtualList.appendChild(cloneNode);
              window.message="";
            }
            if(data.type.toUpperCase()!='TEXT'){
               this.jump();
            }
            this.refresh();
            this.scroll();
            this.html+="<li class='msg-item'>"+this.urlText+"</li>";
            if(!isEmpty(this.voiceText)){
               this.playVoice(this.voiceText);
            }
            this.urlText="";
        },
        playVoice:function(msgContent){
            var _this=this;
            try{
              XuntongJSBridge.call('voiceSynthesize',{
                'text':msgContent,
                'voiceName':'xiaoyan'
              },function(result){
                   if (result.success == true || result.success == 'true') {
                        _this.localId = result.data.localId;
                        var len = result.data.len;
                        XuntongJSBridge.call('playVoice', { localId:_this.localId},
                          function(result) {
                            _this.voiceText="";
                          }
                    );
                }
              })
            }catch(e){
               alert("playVoice is "+e);
            }
        },
        dealType:function(data){
           var _this=this;
           var type=data.type.toUpperCase();
           //var urlText="";
           switch(type){
              case 'URL':
                 var urlContent=data.url;
                 this.urlText="<div class='url-wrapper' data-url="+urlContent.url+" data-event="+'url-'+(parseInt(this.bindEvents.length)+1)+
                 "><span class='url-title'>"+urlContent.title+"</span><span class='url-content'>"
                 +urlContent.content+"</span></div>"
                 this.voiceText+=urlContent.title + ""+urlContent.content;
              break;
              case 'SELECTS':
                  var selectOptions=data.selects;
                  
                  this.urlText="<ul class='custom-select' data-event="+'select-'+(parseInt(this.bindEvents.length)+1)+"><li class='title'>"+data.text+"</li>";
                  this.voiceText+=data.text;
                  selectOptions.forEach(function(item,index){
                      //console.log("this.urlText is ")
                      _this.urlText+="<li class='custom-select-item' data-value='"+(parseInt(index)+1)+"'><span class='custom-select-index'>"+((parseInt(index)+1)+".")+"</span>"
                      for(var key in item){
                        _this.voiceText+=(parseInt(index)+1)+""+item[key];
                        _this.urlText+="<span class='custom-select-"+key+"'>"+item[key]+"</span>";
                      }
                      _this.urlText+="</li>";
                  })
                  this.urlText+="</ul>";
              break;
              case 'TEXT'://纯文字
                  this.urlText='<div class="message new">' + data.text + '</div>';
                  this.voiceText+=data.text;
              break;
              case 'COMFIRM'://确认框带按钮
                  console.log("confirm!");
                  this.urlText+="<div class='custom-confirm message new' data-event="+'confirm-'+(parseInt(this.bindEvents.length)+1)+">"+
                       "<div class='confirm-title'>"+data.text+"</div>"+
                       "<div class='confirm-btn'><span class='confirm-sure'>是</span><span class='confirm-cancel'>否</span></div>"+
                  "</div>";
                  this.voiceText+=data.text;
              break;
              default:

              break;

           }
           if(data.next){
               //console.log("data is "+JSON.stringify(data.next));
               arguments.callee.call(this,data.next);
           }
        },
        //target是否已经绑定event
        isHavedBind:function(target){
            console.log("bindEvb is "+JSON.stringify(this.bindEvents));
            var result=this.bindEvents.filter(function(item,index){
                 //console.log("item is "+item.obj.getAttribute('data-event')+" and target is "+target.getAttribute('data-event'));
                 return item.obj.getAttribute('data-event')==target.getAttribute('data-event');
            });
            return result;
        },
        //页面内点击跳转
        jump:function(){
          var _this=this;
           var urlWrapper=document.querySelectorAll(".url-wrapper");
           //console.log("length is "+urlWrapper.length);
           for(var i=0,len=urlWrapper.length;i<len;i++){
               var target=urlWrapper[i];
               var result= _this.isHavedBind(target);
               //console.log("result is "+result);
               if(result.length>0){
                 
               }else{
                 this.bindEvents.push({obj:target,eventName:'click'});
                 this.bindEvent(urlWrapper[i],'click',function(e){
                     _this.stopPlayVoice();
                     var target=e.target;
                     //console.log("node name is "+target.nodeName);
                     if(target.nodeName!='DIV'){
                       target=target.parentNode;
                     }
                     var url=target.getAttribute('data-url');
                     if(url){
                        localStorage.setItem("htmlContent",_this.html);
                        localStorage.setItem('chatSessionId',window.chatSessionId);
                        location.href=url;
                       //window.open(url);

                     }
                 })
               }
           }
           var selectWrapper=document.querySelectorAll(".custom-select");
           for(var i=0,len=selectWrapper.length;i<len;i++){
              var target=selectWrapper[i];
              var result= _this.isHavedBind(target);
              if(result.length>0){
       
              }else{
                this.bindEvents.push({obj:target,eventName:'click'});
                this.bindEvent(selectWrapper[i],'click',function(e){
                    var target=e.target;
                    _this.stopPlayVoice();
                    if(target.nodeName=='SPAN'){
                        target=target.parentNode;
                    }
                   // console.log("data-key is "+target.getAttribute('data-value'));
                    if(target.getAttribute('data-value')==undefined){
                      return;
                    }else{
                      console.log("value si "+target.getAttribute('data-value'));
                      _this.mode=1;
                      _this.sendMessage(target.getAttribute('data-value'));
               
                    }


                });
              }

           }

           var confirmWraper=document.querySelectorAll('.custom-confirm');
           //console.log("confirmWraper length is "+confirmWraper.length);
           for(var i=0,len=confirmWraper.length;i<len;i++){
              var target=confirmWraper[i];
              var result= _this.isHavedBind(target);
              console.log("result is "+result.length);
              if(result.length>0){
       
              }else{
                this.bindEvents.push({obj:target,eventName:'click'});
                this.bindEvent(target,'click',function(e){
                    var target=e.target;
                    _this.stopPlayVoice();
                    //console.log("hei");
                    if(target.nodeName!='SPAN'){
                        return;
                    }
                    var val=target.innerText;
                    if(val){
                         _this.mode=1;
                         _this.sendMessage(val);
                    }
                });
              }

           }
        },
        scroll:function(){
            this.caculate();
            if(realScrollH > scrollerH){
                var scrollTop=scrollerH - realScrollH;
                console.log("scrollTop is "+scrollTop);
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
            this.sendMessage(data.resultStr);
        },
        //是否云之家客户端 
        isYZJ:function(){
          if(!navigator.userAgent.match(/Qing\/.*;(iOS|iPhone|Android).*/)){
              return false;
          }
          return true;
        },
        //暂停播报
        stopPlayVoice:function(){
           var _this=this;
           XuntongJSBridge.call('stopVoice', {localId:this.localId},
                 function(result){
                  if(String(result['success'])=='true'){
                     _this.localId=0;
                  }
                }
              );
        },
        //调用云之家语音接口
        speak:function(callback){
          var _this=this;
          if(!this.isYZJ()){
              alert("请用云之家打开!");
              return;
          }   
          if(this.localId!=0){
             this.stopPlayVoice();
          }       
           try{
                 XuntongJSBridge.call('voiceRecognize',{

                 },function(result){
                     if(result['success']=='true'){
                         _this.mode=1;
                         var text=result.data.text;
                         if(isEmpty(text)){
                            return ;
                         }
                         text=text.replace(/[\ |\~|\，|\。|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g,""); 
                         _this.sendMessage(text);
                     }
                 })
           }catch(e){

           }
        },
        sendMessage:function(content){
            console.log("contentn is "+content+" and mode is "+this.mode);
            if(this.mode==0){//文字输入
               content=$input.value;
               content=content.replace(/[\ |\~|\，|\。|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g,""); 
               console.log("cntent is "+content);
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
             if(this.mode==1){
                this.mode=0;
             }
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
           //<figure class="avatar right-avatar"><img src='+this.imgArr[0]+' /></figure>
           var inText='<div class="message message-personal">'+content+'</div>'
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
             x = this.hScroll ? x : 0;
             y = this.vScroll ? y : 0;

            if (this.options.useTransform) {
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
          if(window.innerHeight - bottom <= 0){
             return true;
          }
          return false;
        },
    }
    return ChatList;
})