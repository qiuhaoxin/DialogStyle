
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

gulp.task('cssnew',function(){
	gulp.src("../css/newpage.less")
	.pipe(gulpLess())
	.pipe(gulpAutoprefixer({
		browsers:['last 2 versions',"ie > 8"]
	}))
	.pipe(gulpCleanCss())
	.pipe(gulpRename("newindex.min.css"))
	.pipe(gulp.dest('../dist/newstyles'));
})

gulp.task("default",['css']);