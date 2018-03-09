(function(global,factory){
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
    var $list=$('#list');
    var TOUCH_START="touchstart",TOUCH_MOVE="touchmove",TOUCH_END="touchend",
        TRNEND_EV = 'transitionend';
    function ChatList(options){
         this.$btn=getObjById('submit');//发送按钮
         $listContainer=getObjById('list');//消息容器
         $input=document.querySelector(".footer input");
         socket=new Socket("ws://172.20.71.86:8888/rest/ws/api/test");
	     socket.setEventCallBack("onmessage",this.acceptMsg.bind(this))
         socket.open();
        $scroller.style['transitionDuration']="0";
        $scroller.style['transformOrigin']="0 0";
        $scroller.style['transitionTimingFunction'] = 'cubic-bezier(0.33,0.66,0.66,1)';
         this.init();
    }
    ChatList.prototype={
        x:0,
        y:0,
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
        stop: function () {
            if (this.options.useTransition) this.unbindEvent($scroller,TRNEND_EV);//this._unbind(TRNEND_EV);
            else cancelFrame(this.aniTime);
            this.steps = [];
            this.moved = false;
            this.animating = false;
        },
        init:function(){
            var _this=this;
            scrollerH=this.wrapperH=document.body.clientHeight - 44;
            this.wrapperW=document.body.clientWidth;
            if(this.$btn){
                this.bindEvent(this.$btn,'click',this.sendMessage.bind(this))
            }
            if($input){
                this.bindEvent($input,"keyup",function(e){
                     e.preventDefault();
                     if(e.keyCode==13){
                        _this.sendMessage();
                     }
                })
            }
            this.refresh();
            $scroller.style['transition']="";
            this.bindEvent($scroller,TOUCH_START);
        },
        acceptMsg:function(data){
            //data="test";
            var LI=document.createElement('LI');
            LI.classList.add('msg-item');
            //<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + Fake[i] + '</div>'
            //var inerText='<div class="message loading new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure><span></span></div>';
            var inerText='<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + data + '</div>'
            LI.innerHTML=inerText;
            $listContainer.appendChild(LI);
            this.refresh();
            this.scroll();

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
        sendMessage:function(e){
            var inputVal=$input.value;
             if(isEmpty(inputVal)){
                return;
             } 
             this.insertMsg(0,inputVal);
             socket.send(inputVal);
             //清空输入框
             this.clearInput();
            // this.acceptMsg();
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
           var MSG=document.createElement('DIV');
           MSG.classList.add('message');
           MSG.classList.add('message-personal');
           MSG.innerHTML=content;
           LI.appendChild(MSG);
           $listContainer.appendChild(LI);
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
    }
    return ChatList;
})