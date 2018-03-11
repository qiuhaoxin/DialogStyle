//gulp concat-uglify js and css 


const gulp=require("gulp");
const concat=require('gulp-concat');
const uglify=require('gulp-uglify');

gulp.task('dealJs',function(){
	gulp.src(['./js/rem.js','./js/socket.js','./js/chatlist.js','./js/qingjs.js'])
	.pipe(concat('index.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('./dist/js'));
})

gulp.task('default',['dealJs']);