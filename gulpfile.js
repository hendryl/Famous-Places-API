'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var util = require('gulp-util');
var wait = require('gulp-wait');
var runSequence = require('run-sequence');
var mocha = require('gulp-mocha');

var sourceFiles = [
  'app.js',
  './controllers/*.js',
  './helpers/*.js',
  './models/*.js',
  './tests/*.js'
];
var testFiles = ['tests/*.js', 'tests/**/*.js'];

gulp.task('jshint', function() {
  gulp.src(sourceFiles)
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', function() {
  gulp.watch(sourceFiles, runSequence('jshint', 'test'));
});

gulp.task('test', function() {
  gulp.src(testFiles, { read: false })
  // wait until all jshint logs are printed
  .pipe(wait(500))
  .pipe(mocha({ reporter: 'spec'}))
  .on('error', util.log);
});

gulp.task('default', function(callback) {
  runSequence('jshint', 'test', callback);
});
