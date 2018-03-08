
var gulp=require('gulp');
var gulpRename=require('gulp-rename');
var gulpAutoprefixer=require('gulp-autoprefixer');
var gulpLess=require('gulp-less');
var gulpCleanCss=require('gulp-clean-css');


gulp.task('css',function(){
	gulp.src("../css/page.less")
	.pipe(gulpLess())
	.pipe(gulpAutoprefixer({
		browsers:['last 2 versions',"ie > 8"]
	}))
	.pipe(gulpCleanCss())
	.pipe(gulpRename("index.min.css"))
	.pipe(gulp.dest('../dist/styles'));
})

gulp.task("default",['css']);