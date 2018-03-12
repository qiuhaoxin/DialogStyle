;(function(global,factory){
	//
    if(typeof define==='function' && define.amd){
    	define([],factory);
    }else if(typeof module!=='undefined' && module.exports){
    	module.exports=factory();
    }else{
    	global.Socket=factory();
    }
})(this,function(){
	if(!'WebSocket' in window){
		return;
	} 
	function Socket(url,protocols,options){
        var defaultSetting={
        	debug:false,
        	automaticOpen:true,
        	reconnectInterval:1000,
        	maxReconnectInterval:30000,
        	reconnectDecay:1.5,
        	timeoutInterval:2000,
        	maxReconnectAttempts:null,
        	binaryType:'blob'
        }
        if(!options){
        	options={}
        }
        for(var key in defaultSetting){
        	if(typeof options[key]!='undefined'){
        		this[key]=options[key];
        	}else{
        		this[key]=defaultSetting[key];
        	}
        }
        this.url=url;
        this.reconnectAttempts=0;
        this.readyState=WebSocket.CONNECTING;
        this.protocol=null;

        var self=this;
        var ws;
        var forcedClose=false;
        var timedOut=false;
        var eventTarget=document.createElement('div');

        eventTarget.addEventListener('open',function(e){self.onopen(e)});
        eventTarget.addEventListener('close',function(e){self.onclose(e)});
        eventTarget.addEventListener('message',function(e){console.log("onmessage"); self.onmessage(e)});
        eventTarget.addEventListener('error',function(e){self.onerror(e)});
        eventTarget.addEventListener('connecting',function(e){self.onconnecting(e)});

        this.addEventListener=eventTarget.addEventListener.bind(eventTarget);
        this.removeEventListener=eventTarget.removeEventListener.bind(eventTarget);
        this.dispatchEvent=eventTarget.dispatchEvent.bind(eventTarget);


        function generateEvent(s,args){
        	var evt=document.createEvent("CustomEvent");
        	evt.initCustomEvent(s, false, false, args);
        	return evt;
        };
        this.open=function(reconnectAttempt,callBack){
            ws=new WebSocket(self.url,protocols || []);
            ws.binaryType=this.binaryType;
            if(reconnectAttempt){
                if(this.maxReconnectAttempts && this.reconnectAttempts > this.maxReconnectAttempts){
                	return;
                }
            }else{

            	eventTarget.dispatchEvent(generateEvent('connecting'));
            	this.reconnectAttempt=0;
            }
            if(self.debug || Socket.debugAll){
            	console.debug("Socket");
            }
            var localWs=ws;
            var timeout=setTimeout(function(){
                timedOut=true;
                localWs.close();
                timedOut=false;
            },self.timeoutInterval);

            ws.onopen=function(event){
               clearTimeout(timeout);
               if(self.debug || Socket.debugAll){
               	  console.debug("Socket","onopen",self.url);
               }
               self.protocol=ws.protocol;
               self.readyState=WebSocket.OPEN;
               self.reconnectAttempts=0;
               var e=generateEvent('open');
               e.isReconnect=false;
               eventTarget.dispatchEvent(e);
               if(callBack){
                  callBack();
               }
            }
            ws.onclose = function(event) {
                clearTimeout(timeout);
                ws = null;
                if (forcedClose) {
                    self.readyState = WebSocket.CLOSED;
                    eventTarget.dispatchEvent(generateEvent('close'));
                } else {
                    self.readyState = WebSocket.CONNECTING;
                    var e = generateEvent('connecting');
                    e.code = event.code;
                    e.reason = event.reason;
                    e.wasClean = event.wasClean;
                    eventTarget.dispatchEvent(e);
                    if (!reconnectAttempt && !timedOut) {
                        if (self.debug || Socket.debugAll) {
                            console.debug('ReconnectingWebSocket', 'onclose', self.url);
                        }
                        eventTarget.dispatchEvent(generateEvent('close'));
                    }

                    var timeout = self.reconnectInterval * Math.pow(self.reconnectDecay, self.reconnectAttempts);
                    setTimeout(function() {
                        self.reconnectAttempts++;
                        self.open(true);
                    }, timeout > self.maxReconnectInterval ? self.maxReconnectInterval : timeout);
                }
            };
            ws.onmessage = function(event) {
                if (self.debug || Socket.debugAll) {
                    console.debug('Socket', 'onmessage', self.url, event.data);
                }

                var e = generateEvent('message');
                e.data = event.data;
                eventTarget.dispatchEvent(e);
            };
            ws.onerror = function(event) {
                if (self.debug || Socket.debugAll) {
                    console.debug('Socket', 'onerror', self.url, event);
                }
                eventTarget.dispatchEvent(generateEvent('error'));
            };

        }

        if(this.automaticOpen){
        	this.open(false);
        }

        this.send=function(data){
        	console.log("hei send data is "+data);
        	if(ws){
        		if(self.debug || Socket.debugAll){
        			console.debug("Socket","send",self.url,data);
        		}
               return ws.send(data);
        	}else{
                throw "INVALID_STATE_ERR: Pasuing to reconnect!"
        	}
        }
        this.close=function(code,reason){
        	if(typeof code=='undefined'){
        		code=1000;
        	}
        	forcedClose=true;
        	if(ws){
        		ws.close(code,reason);
        	}

        };
        this.refresh=function(){
        	if(ws){
        		ws.close();
        	}
        }
	}

    Socket.prototype={
        eventObj:{},
        onopen:function(event){

        },
        onclose:function(event){

        },
        onconnecting:function(event){

        },
        onmessage:function(event){
            if(this.eventObj['onmessage']){
                this.eventObj['onmessage'](event.data);
            }
        },
        onerror:function(event){

        },
        //对外开放的接口，可以设置执行相应事件的函数
        setEventCallBack:function(options){
            console.log("arguments is "+arguments.length);
           if(arguments.length>1){
               this.eventObj[arguments[0]]=arguments[1];
           }else{
              for(var key in options){
                  this.eventObj[key]=options[key];
              }
           }
        }

    }

    Socket.debugAll=false;

    Socket.CONNECTING=WebSocket.CONNECTING;
    Socket.OPEN=WebSocket.OPEN;
    Socket.CLOSED=WebSocket.CLOSED;
    Socket.CLOSING=WebSocket.CLOSING;

	return Socket;
})