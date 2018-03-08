var $msg=$('.message-content'),d,h,m,i=0;
var socket=null;
$(window).load(function(){
	$msg.mCustomScrollbar();
	setTimeout(function(){
        fakeMessage();
	},100)

    // socket=new WebSocket("ws://172.20.71.86:8888/rest/ws/api/test");
    // socket.onopen=function(){
    // 	console.log("已连接!");
    // }
    // socket.onmessage=function(e){
    //    console.log("get message is "+e.data);
    // }
    // socket.onerror=function(){

    // }
    // socket.onclose=function(){
    // 	console.log("socket 已关闭!");
    // }
    socket=new Socket("ws://172.20.71.86:8888/rest/ws/api/test");
    socket.open();
    
})

$('.voice input').bind("keyup",function(e){
	if(e.keyCode==13){
		console.log("you input str is "+e.target.value);
		var val=$.trim(e.target.value);
		//insertMessage(val);
		socket.send(val);
	}
})
function setDate(){
	d=new Date();
	if(m!=d.getMinutes()){
		m=d.getMinutes();
		$('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
	}
}
function updateScrollbar(){
   $msg.mCustomScrollbar('update').mCustomScrollbar('scrollTo','bottom',{
   	   scrollInertia:10,
   	   timeout:0
   });
}
function insertMessage(val){
   $("<div class='message message-personal'>"+val+"</div>").appendTo($('.mCSB_container')).addClass('new');
   setDate();
   $('.voice input').val('');
   updateScrollbar();
   setTimeout(function(){
      fakeMessage();
   },1000+(Math.random() * 20) * 100);
}
var Fake = [
  'Hi there, I\'m Fabio and you?',
  'Nice to meet you',
  'How are you?',
  'Not too bad, thanks',
  'What do you do?',
  'That\'s awesome',
  'Codepen is a nice place to stay',
  'I think you\'re a nice person',
  'Why do you think that?',
  'Can you explain?',
  'Anyway I\'ve gotta go now',
  'It was a pleasure chat with you',
  'Time to make a new codepen',
  'Bye',
  ':)'
]
function fakeMessage(){
	console.log("fakeMessage");
	if($('.voice input').val()!=''){
		return false;
	}
	  $('<div class="message loading new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure><span></span></div>')
	  .appendTo($('.mCSB_container'));
  updateScrollbar();
 
  // setTimeout(function() {
  // 	console.log("content is "+Fake[i]);
  //   $('.message.loading').remove();
  //   $('<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + Fake[i] + '</div>').appendTo($('.mCSB_container')).addClass('new');
  //   setDate();
  //   updateScrollbar();
  //   i++;
  // }, 1000 + (Math.random() * 20) * 100);
}