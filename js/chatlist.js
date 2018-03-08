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
    function ChatList(options){
         console.log("init chatlist");
         this.$btn=getObjById('submit');//发送按钮
         $listContainer=getObjById('list');//消息容器
         $input=document.querySelector(".footer input");
         socket=new Socket("ws://172.20.71.86:8888/rest/ws/api/test");
	     socket.setEventCallBack("onmessage",this.acceptMsg.bind(this))
         socket.open();
         this.init();
    }
    //页面初始化
    ChatList.prototype.init=function(){
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
    }
    //接收服务器返回的信息
    ChatList.prototype.acceptMsg=function(data){
       var LI=document.createElement('LI');
       LI.classList.add('msg-item');
       //<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + Fake[i] + '</div>'
       //var inerText='<div class="message loading new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure><span></span></div>';
       var inerText='<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + data + '</div>'
       LI.innerHTML=inerText;
       $listContainer.appendChild(LI);
       this.scroll();

    }
    ChatList.prototype.scroll=function(){
    	this.caculate();
    	console.log("ehi");
    	$listContainer.scrollLeft=20;
    	if(realScrollH > scrollerH){
    		var scrollTop=scrollerH - realScrollH;
    		 console.log("should scroll pas "+scrollTop);
    		 //$listContainer.scrollTop=(realScrollH-scrollerH);
    		 $listContainer.scrollLeft=20;
    		 console.log("scroll Top is "+$listContainer.scrollTop);
    		//$listContainer.style['-webkit-transform']="translate3d(0px,"+scrollTop+"px,0px)";
    	}
    }
    ChatList.prototype.caculate=function(){
    	realScrollH=$listContainer.scrollHeight;
    }
    ChatList.prototype.clearInput=function(){
    	$input.value="";
    }
    ChatList.prototype.sendMessage=function(e){
    	var inputVal=$input.value;
    	 if(isEmpty(inputVal)){
    	 	return;
    	 } 
         this.insertMsg(0,inputVal);
    	 socket.send(inputVal);
    	 //清空输入框
    	 this.clearInput();
    	 this.scroll();
    }
    ChatList.prototype.setDate=function(){
    	var d=new Date();
    	var timeDIV=document.createElement('DIV');
    	timeDIV.innerHTML=d.getHours()+":"+d.getMinutes();
    	return timeDIV;
    }
    //显示消息到界面  type:用户问（显示在界面左边）：0  系统答(内容显示在界面右边):1  ,content:消息内容
    ChatList.prototype.insertMsg=function(type,content){
       var LI=document.createElement('LI');
       LI.classList.add('msg-item');
       var MSG=document.createElement('DIV');
       MSG.classList.add('message');
       MSG.classList.add('message-personal');
       MSG.innerHTML=content;
       LI.appendChild(MSG);
       $listContainer.appendChild(LI);
    }
    ChatList.prototype.bindEvent=function(obj,eventName,callback){
        obj.addEventListener(eventName,callback,false);
    }
    ChatList.prototype.unbindEvent=function(obj,eventName,callback){
    	obj.removeEventListener(eventName,callback,false);
    }

    return ChatList;
})