// Requires
const gulp = require("gulp");
const prefix = require("gulp-autoprefixer");
const sass = require("gulp-sass")(require('sass'));
const browserSync = require("browser-sync");

/* ----------------------------------------- */
/*  Compile Sass
/* ----------------------------------------- */

// Small error handler helper function.
function handleError(err) {
    console.log(err.toString());
    this.emit("end");
}

const SYSTEM_SCSS = ["system/styles/conf/**/*.scss"];
function compileScss() {
    // Configure options for sass output. For example, 'expanded' or 'nested'
    let options = {
        outputStyle: "compressed",
    };
    return gulp
        .src(SYSTEM_SCSS)
        .pipe(sass(options).on("error", handleError))
        .pipe(
            prefix({
                cascade: false,
            })
        )
        .pipe(gulp.dest("system/styles"))
        .pipe(
            browserSync.reload({
                stream: true,
            })
        );
}
const css = gulp.series(compileScss);

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
    gulp.watch("system/styles/scss/**/*.scss", css);
}

/* ----------------------------------------- */
/*  BrowserSync
/* ----------------------------------------- */

function bSync() {
    browserSync({
        server: {
            baseDir: "system/styles",
        },
    });
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.default = gulp.series(compileScss, watchUpdates, bSync);
exports.css = css;
