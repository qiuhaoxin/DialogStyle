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

    var realScrollH=0,m=Math;

    var $footer=getObjById('footer'),$change=getObjById('change'),$changeVoice=getObjById('changeVoice');
    var $voice=getObjById('voice');

    var showVirtual=false;//是否显示虚拟的box;
    //var $virtual=getObjById('virtual-box');//虚拟wrapper
    //var $virtualList=getObjById('virtualList');


    // var $scoketTip=getObjById('socket_tip');//用来提示websocket的状态
    // window.scoketTip=$scoketTip;
    function ChatList(options){
         var _this=this;
         this.$btn=getObjById('submit');//发送按钮
         $listContainer=getObjById('list');//消息容器
         $input=document.querySelector(".footer input");

        //   var loc = document.location;
        //   var protocolStr = loc.protocol;
        //   var wsProtocl = "ws:";
        //   if(protocolStr == "https:"){
        //       wsProtocl = "wss:";
        //   }
        // var address = wsProtocl + loc.host + window.context+'/ws/api/chatbot';
        //"ws://172.20.71.86:8888/rest/ws/api/test"
       // window.message="明天从深圳到北京出差后天返回";
       //  socket=new Socket(address);
	      // socket.setEventCallBack("onmessage",this.acceptMsg.bind(this))
       //  socket.open(false,function(){
       //      var timeouter=setTimeout(function(){
       //          var StoreState=localStorage.getItem('storeState');
       //          console.log("StoreState is "+_this.needSendMsg);
       //          if(window.message && !isEmpty(window.message) && _this.needSendMsg){
       //             var chatSessionId=localStorage.getItem('chatSessionId');
       //             _this.mode=1; 
       //            ///_this.shouldShowVirtual();
       //            _this.sendMessage(window.message);
       //            _this.mode=0;
                
       //         }
       //         clearTimeout(timeouter);
       //      },200)
       //  });
        this.init();
    }
    ChatList.prototype={
        x:0,
        y:0,
        mode:0,//输入的模式 0：文字输入  1：语音输入,
       // imgArr:null,
        html:"",
        urlText:'',
        localId:0,//云之家语音播报
        voiceText:'',//云之家语音播报
        bindEvents:[],//事件列表，主要放已经绑定事件的对象 {'obj':obj,eventName:'click',callBack:fn}
        needSendMsg:true,
        init:function(){
            var _this=this;
            //从本地localStorage 取回上次url跳转的对话和sessionId 并恢复
            var StoreState=localStorage.getItem('storeState');
            if(StoreState){
              this. needSendMsg=false;
              StoreState=JSON.parse(StoreState);
              this.html=StoreState['htmlContent'];
              window.chatSessionId=StoreState['chatSessionId'];
              localStorage.removeItem('storeState');
              $listContainer.innerHTML=this.html;
              this.scroll();
              this.jump();
            }
            if(this.needSendMsg && window.message && !isEmpty(window.message)){
                this.mode=1;
                _this.sendMessage(window.message);
                this.mode=0;
            }

            XuntongJSBridge.call('defback', {}, function () {
                //localStorage.setItem('htmlContent','');
                //localStorage.removeItem('chatSessionId');
                localStorage.removeItem("storeState")
                XuntongJSBridge.call('closeWebView');
            })

            scrollerH=this.wrapperH=document.body.clientHeight - 44;
            this.wrapperW=document.body.clientWidth;
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
                // this.bindEvent($input,"focus",function(e){
                //   setTimeout(function(){
                //       _this.shouldShowVirtual();
                //   },300);
                // })
                // this.bindEvent($input,"blur",function(e){
                //   clearInterval(_this.timer);//清除计时器
                //   //document.body.scrollTop = bfscrolltop;//将软键盘唤起前的浏览器滚动部分高度重新赋给改变后的高度
                //   showVirtual=false;
                //   //$virtual.style['visibility']="hidden";
                // })
            }
           // this.refresh();
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
            //this.bindEvent($scroller,TOUCH_START);

        },
        //是否应该显示虚拟框
        // shouldShowVirtual:function(){
        //     var boardScrollH=document.body.scrollTop;//input获取焦点页面被推上的高度
        //     var containerH=$listContainer.clientHeight;
        //     //$input.value="scrollis "+boardScrollH+" and listContainer "+containerH;
        //     if((parseInt(containerH) + 30) < boardScrollH){
        //       if($input==document.activeElement){
        //          //showVirtual=true;
        //          //$virtual.style['visibility']="visible";
        //       }
        //     }
        // },
        //点击跳转url时，弹出masker避免用户觉得界面假死
        showMasker:function(){
            var maskerDiv=getObjById('masker');
            if(!maskerDiv){
              maskerDiv=document.createElement('DIV');
              maskerDiv.classList.add('masker');
              maskerDiv.id="masker";
              maskerDiv.innerHTML="<div class='dialog-wrapper'><span></span></div>";
            }
            maskerDiv.style['visibility']="visible";
            document.body.appendChild(maskerDiv);
        },
        hideMasker:function(){
           var maskerDiv=getObjById('masker');
           if(maskerDiv){
              maskerDiv.style['visibility']='hidden';
           }
        },
        acceptMsg:function(data){
            var data = JSON.parse(data);

            var LI=document.createElement('LI');
            LI.classList.add('msg-item');
            this.dealType(data);
            LI.innerHTML=this.urlText;//inerText;
            var cloneNode=LI.cloneNode();
            cloneNode.innerHTML=this.urlText;//inerText;
            $listContainer.appendChild(LI);
            if(showVirtual || !isEmpty(window.message)){
              //$virtualList.appendChild(cloneNode);
              window.message="";
            }
           // if(data.type.toUpperCase()!='TEXT' || (data.type.toUpperCase()=='TEXT' && data.next && data.next.type.toUpperCase()!='TEXT')){
               this.jump();
           // }
            this.scroll();
            this.html+="<li class='msg-item'>"+this.urlText+"</li>";
            // if(!isEmpty(this.voiceText)){
            //    this.playVoice(this.voiceText);
            // }
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
           var dataEvent='';
           //var urlText="";
           switch(type){
              case 'URL':
                 var urlContent=data.url;
                 dataEvent="url-"+(parseInt(this.bindEvents.length)+1);//'url-'+(parseInt(this.bindEvents.length)+1)
                 this.urlText="<div class='url-wrapper' data-url="+urlContent.url+" data-event="+dataEvent+
                 "><span class='url-title'>"+urlContent.title+"</span><span class='url-content'>"
                 +urlContent.content+"</span></div>"
                 this.voiceText+=urlContent.title + ""+urlContent.content;
              break;
              case 'SELECTS':
                  var selectOptions=data.selects;
                  dataEvent='select-'+(parseInt(this.bindEvents.length)+1);//'select-'+(parseInt(this.bindEvents.length)+1)
                  this.urlText="<ul class='custom-select redhot' data-event="+dataEvent+"><li class='title'>"+data.text+"</li>";
                  this.voiceText+=data.text;
                  selectOptions.forEach(function(item,index){
                      //console.log("this.urlText is ")
                      _this.urlText+="<li class='custom-select-item noplayvoice' data-value='"+(parseInt(index)+1)+"'><span class='custom-select-index noplayvoice'>"+((parseInt(index)+1)+".")+"</span>"
                      for(var key in item){
                        _this.voiceText+=(parseInt(index)+1)+""+item[key];
                        _this.urlText+="<span class='custom-select-"+key+" noplayvoice'>"+item[key]+"</span>";
                      }
                      _this.urlText+="</li>";
                  })
                  this.urlText+="</ul>";
              break;
              case 'TEXT'://纯文字
                  dataEvent="text-"+(parseInt(this.bindEvents.length)+1);//text-'+(parseInt(this.bindEvents.length)+1)+'
                  this.urlText='<div class="message new redhot" data-event="'+dataEvent+'">' + data.text + '</div>';
                  this.voiceText+=data.text;
              break;
              case 'COMFIRM'://确认框带按钮
                  dataEvent='confirm-'+(parseInt(this.bindEvents.length)+1);//'confirm-'+(parseInt(this.bindEvents.length)+1)
                  this.urlText+="<div class='custom-confirm message new redhot' data-event="+dataEvent+">"+
                       "<div class='confirm-title'>"+data.text+"</div>"+
                       "<div class='confirm-btn noplayvoice'><span class='confirm-sure noplayvoice'>是</span><span class='confirm-cancel noplayvoice'>否</span></div>"+
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
                     _this.showMasker();
                     if(target.nodeName!='DIV'){
                       target=target.parentNode;
                     }
                     var url=target.getAttribute('data-url');
                     if(url){
                       var obj={};
                       obj['chatSessionId']=window.chatSessionId;
                       obj['htmlContent']=$listContainer.innerHTML;//_this.html;
                       localStorage.setItem("storeState",JSON.stringify(obj));
                       location.href=url;
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
                    if(target.nodeName=='SPAN' && target.classList.contains('noplayvoice')){
                        target=target.parentNode;
                    }else{
                       // var voiceStr=target.innerText;
                        //var target=target.parentNode;

                        console.log("should playvoice !"+target.innerText);
                        _this.playVoice(target.innerText);
                        if(target.classList.contains('redhot')){
                          target.classList.remove('redhot');
                        }else{
                          target=target.parentNode;
                          target.classList.remove('redhot');
                        }
                        return;
                    }
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
                    if(target.nodeName!='SPAN' && !target.classList.contains('noplayvoice')){
                        console.log("should playvoice!"+target.innerText);
                        _this.playVoice(target.innerText);
                        if(target.classList.contains('redhot')){
                          target.classList.remove('redhot');
                        }else{
                          target=target.parentNode;
                          target.classList.remove('redhot');
                        }
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

           var textWrapper=document.querySelectorAll('.new');
           for(var i=0,len=textWrapper.length;i<len;i++){
              var target=textWrapper[i];
              var result= _this.isHavedBind(target);
              console.log("bind new!");
              if(result.length>0){
       
              }else{
                this.bindEvents.push({obj:target,eventName:'click'});
                this.bindEvent(target,'click',function(e){
                    var target=e.target;
                    target.classList.remove('redhot');
                    _this.stopPlayVoice();
                    //console.log("hei");
                    if(target.nodeName!='DIV'){
                        return;
                    }
                    var val=target.innerText;
                    console.log("val is "+val);
                    if(val){
                         //_this.mode=1;
                         //_this.sendMessage(val);
                         _this.playVoice(val)
                    }
                });
              }
           }
        },
        scroll:function(){
            this.caculate();
            $listContainer.scrollTop=$listContainer.scrollHeight + $listContainer.offsetHeight + 50;
        },
        caculate:function(){
            realScrollH=$scroller.scrollHeight;
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
                         text=text.replace(/[\ |\~|\，|\。|\`|\!|\！|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?|\？]/g,""); 
                         //拼音匹配
                         _this.ajax("tongyinConvert",{sessionId:window.chatSessionId,text:text},function(data){
                           //alert("data is "+JSON.stringify(data))
                           if(data['code']=='00'){
                             text=data['text'];
                             _this.sendMessage(text);
                           }else{
                              alert(data['text'])
                           }

                         });
                     }
                 })
           }catch(e){

           }
        },
        sendMessage:function(content){
            var _this=this;
            console.log("contentn is "+content+" and mode is "+this.mode);
            if(this.mode==0){//文字输入
               content=$input.value;
               console.log("sessionId is "+window.chatSessionId);
              // this.ajax("tongyinConvert",{sessionId:window.chatSessionId,text:content},function(data){
              //   console.log("data is "+JSON.stringify(data));
              // });
              content=content.replace(/[\ |\~|\，|\。|\`|\!|\！|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?|\？]/g,""); 
              if(isEmpty(content)){
                  return;
              }
            } 
            this.insertMsg(0,content);
            // socket.send(JSON.stringify({sessionId:window.chatSessionId,message:content}));
            this.ajax("chat",{sessionId:window.chatSessionId,message:content},function(data){
                _this.acceptMsg(data.message);
                if(_this.mode==1){
                   _this.mode=0;
                }
            })
             //清空输入框
             this.clearInput();
            // this.refresh();
             this.scroll();
        },
        ajax:function(urlName,data,callBack){
            var _this=this;
            $.ajax({
              url:'../chatbot/'+urlName,
              dataType:'json',
              type:'POST',
              data:data,
              success:function(data){
                  console.log("ajax result is "+JSON.stringify(data));
                  if(callBack)callBack(data)
                  //_this.acceptMsg(data.message);

              },
              error:function(rejection){
                 console.log("error is "+JSON.stringify(rejection));
              }
            })
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
          // if(showVirtual || !isEmpty(window.message)){
           //  $virtualList.appendChild(cloneNode);
           //}
           var str="<li class='msg-item'>"+inText+"</li>";
           this.html+=str;
        },
        bindEvent:function(obj,eventName,callback){
           obj.addEventListener(eventName,callback || this,false);
        },
        unbindEvent:function(obj,eventName,callback){
           obj.removeEventListener(eventName,callback || this,false);
        }
    }
    return ChatList;
})