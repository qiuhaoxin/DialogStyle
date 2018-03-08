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
    var socket=null;
    var scrollerH=0;
    var realScrollH=0;
    var $list=$('#list');
    var TOUCH_START="touchstart",TOUCH_MOVE="touchmove",TOUCH_END="touchend";
    function ChatList(options){
         console.log("init chatlist");
         this.$btn=getObjById('submit');//发送按钮
         $listContainer=getObjById('list');//消息容器
         $input=document.querySelector(".footer input");
         //socket=new Socket("ws://172.20.71.86:8888/rest/ws/api/test");
	     //socket.setEventCallBack("onmessage",this.acceptMsg.bind(this))
         //socket.open();
         this.init();
    }
    ChatList.prototype={
        handle:function(e){
           var type=e.type;
           switch(type){
              case "":

              break;
           }
        },
        init:function(){
            var _this=this;
            scrollerH=document.body.clientHeight - 44;
            console.log("scrollerH is "+scrollerH);
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
        },
        acceptMsg:function(data){
            data="test";
            var LI=document.createElement('LI');
            LI.classList.add('msg-item');
            //<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + Fake[i] + '</div>'
            //var inerText='<div class="message loading new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure><span></span></div>';
            var inerText='<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + data + '</div>'
            LI.innerHTML=inerText;
            $listContainer.appendChild(LI);
            this.scroll();

        },
        scroll:function(){
            this.caculate();
            //$listContainer.scrollLeft=20;
            console.log("realScrollH is "+$list[0].scrollHeight);
            //$listContainer.style['top']="20px";
            if(realScrollH > scrollerH){
                var scrollTop=scrollerH - realScrollH;
                 console.log("should scroll pas "+realScrollH);
                 //$listContainer.scrollTop=(realScrollH-scrollerH);
                 //$listContainer.scrollLeft=20;
                 $list[0].scrollTop=$list[0].scrollHeight;
            }
        },
        caculate:function(){
            realScrollH=$listContainer.scrollHeight;
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
             //socket.send(inputVal);
             //清空输入框
             this.clearInput();
               this.acceptMsg();
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
           obj.addEventListener(eventName,callback,false);
        },
        unbindEvent:function(obj,eventName,callback){
           obj.removeEventListener(eventName,callback,false);
        }
    }
    return ChatList;
})