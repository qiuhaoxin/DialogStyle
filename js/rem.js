;(function(win,doc){
   var docEl=doc.documentElement;
   var dpr=win.devicePixelRatio || 1;
   function setBodyFontSize(){
	   	if(doc.body){
	   		doc.body.style.fontSize=(12 *  dpr)+"px";
	   	}
	   	else{
	   		doc.addEventListener('DOMContentLoaded',setBodyFontSize);
	   	}

   }
   setBodyFontSize();

   function setRemUnit(){
   	   var rem=docEl.clientWidth / 10;
   	   docEl.style.fontSize=20+"px";
   }
   setRemUnit();

   window.addEventListener("resize",setRemUnit);
   window.addEventListener("pageshow",function(e){
   	  if(dpr>=2){
   	  	var fakeBody=doc.createElement('body');
   	  	var testElement=doc.createElement('div');
   	  	testElement.style.border=".5px solid transparent";
   	  	fakeBody.appendChild(testElement);
   	  	docEl.appendChild(fakeBody);

   	  	if(testElement.offsetHeight===1){
   	  		docEl.classList.add('hairlines');
   	  	}
   	  	docEl.removeChild(fakeBody);
   	  }
   })
})(window,document)