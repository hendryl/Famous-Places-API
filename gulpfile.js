'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var util = require('gulp-util');
var wait = require('gulp-wait');
var runSequence = require('run-sequence');
var mocha = require('gulp-mocha');

gulp.task('jshint', function() {
  gulp.src(['*.js', 'src/**/*.js'])
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', function() {
  gulp.watch('./src/**/*.js', runSequence('jshint', 'test'));
});

gulp.task('test', function() {
  gulp.src(['test/*.js', 'test/**/*.js'], { read: false })
  // wait until all jshint logs are printed
  .pipe(wait(500))
  .pipe(mocha({ reporter: 'spec'}))
  .on('error', util.log);
});

gulp.task('default', function(callback) {
  runSequence('jshint', 'test', callback);
});
