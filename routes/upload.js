const express = require('express');
const router = express.Router();
const fs = require('fs');
const util = require('util');
const StreamZip = require('node-stream-zip');
const rimraf = require('rimraf');
const mkdirp = require('async-mkdirp');
const dir = require('node-dir');
const compressor = require('node-minify');
const sanitizeHtml = require('sanitize-html');
const Exercise = require('../models/Exercise');
const concat = require('concat');
const minifyAll = require("minify-all");
const Extrator = require("html-extractor");
const {VM} = require('vm2');
const vm = new VM();
// const multer  = require('multer');

const rename = util.promisify(fs.rename);

const routeExcercises = `${__dirname}/../exercises`;
let tmpFolder = `${routeExcercises}/tmp`;
let exerciseName = '';
let tmpRoute = '';
let finalRoute = '';

// const upload = multer({ dest: tmpFolder });

// router.use((req, res, next) => {
    /* */
    // rimraf(`${routeExcercises}/*`, (err) => {
    //     if(err) {
    //         next(err);
    //         return;
    //     }

    //     rimraf(`${__dirname}/../public/exercises/*`, (err) => {
    //         if(err) {
    //             next(err);
    //             return;
    //         }
    //         next();
    //     });

    // });
    /* */
// });

/**
* Unzip in temp
*/

router.use((req, res, next) => {

    if (!fs.existsSync(tmpFolder)){
        fs.mkdirSync(tmpFolder);
    }

    let exerciseFile = req.files.file;
    let unzipFolderName = exerciseFile.name.split('.').slice(0, -1).join('.');
    exerciseName = req.body.exerciseName.replace(/\s/g, '-').toLowerCase();

    tmpRoute = `${routeExcercises}/tmp/${unzipFolderName}`;
    finalRoute = `${routeExcercises}/${exerciseName}`;

    let uploadedZipFile = `${routeExcercises}/tmp/${exerciseFile.name}`;

    exerciseFile.mv(uploadedZipFile, (err) => {
        if(err) {
            next(err);
            return;
        }

        const zip = new StreamZip({
            file: uploadedZipFile,
            storeEntries: true
        });

        zip.on('ready', () => {
            zip.extract(null, tmpFolder, (err) => {
                if(err) {
                    next(err);
                    return;
                }

                zip.close();
                next();
            });
        });

    });

});

/**
*  Create new directories
*/

router.use((req, res, next) => {

    (async () => {
        await mkdirp(finalRoute)
        await Promise.all([
            mkdirp(`${finalRoute}/js`),
            mkdirp(`${finalRoute}/css`),
            mkdirp(`${finalRoute}/img`)
        ]);
        next();
    })();

});

/**
*  Moving basic project files to public directory
*/

router.use((req, res, next) => {
    const arrFiles = [
        'poster.jpg',
        'info.json'
        ];

    const publicDir = `${__dirname}/../public/exercises/${exerciseName}`;

    fs.mkdirSync(publicDir);

    (async () => {
        await Promise.all(arrFiles.map(fileName => {
            fs.rename(`${tmpRoute}/${fileName}`, `${publicDir}/${fileName}`, function (err) {
                if (err) throw err;
            });
        }));
        next();
    })();
});

/**
*  Moving images to the new directory
*/

router.use((req, res, next) => {
    const arrImages = [];

    dir.readFiles(`${tmpRoute}/img`,
        {
            match: /.(gif|jpg|jpeg|svg|png|webp)$/,
            exclude: /^\./,
            shortName: true
        },
        function(err, content, filename, next) {
        arrImages.push(filename);
        next();
    },
    function(err, files){
        if (err) throw err;

        (async () => {
            await Promise.all(arrImages.map(imageFile => {
                fs.rename(`${tmpRoute}/img/${imageFile}`, `${finalRoute}/img/${imageFile}`, function (err) {
                    if (err) throw err;
                });
            }));
            next();
        })();

    });

});

/**
*  Merge & uglify JS
*/

router.use((req, res, next) => {
    let promise = compressor.minify({
        compressor: 'uglifyjs',
        input: `${tmpRoute}/js/**/*.js`,
        output: `${finalRoute}/js/bundle.js`
    });
    promise.then(function(min) {
        next();
    });

});

/**
*  Merge CSS
*/

router.use((req, res, next) => {
    let cssFiles = [];

    dir.readFiles(`${tmpRoute}/css`, { match: /.css$/, exclude: /^\./ }, function(err, content, filename, next) {
        cssFiles.push(filename);
        next();
    },
    function(err, files){
        if (err) throw err;
        concat(cssFiles, `${finalRoute}/css/bundle.css`).then( () => {
            next();
        });
    });

});

/**
*  Sanitize HTML
*/

router.use((req, res, next) => {
    const tempHTML = fs.readFileSync(`${tmpRoute}/index.html`, "utf8");
    const cssStyles = fs.readFileSync(`${finalRoute}/css/bundle.css`, "utf8");
    const bodyStartIndx = tempHTML.search('<body');
    const bodyEndStart = tempHTML.search('</body');
    let vmJs = '';

    const bodyEndIndx = () => {
        const lastChunk = tempHTML.substring(bodyEndStart);
        return (bodyEndStart + lastChunk.search('>') + 1);
    }

    const bodyContent = () => tempHTML.substring(bodyStartIndx, bodyEndIndx());

    const cleanBody = sanitizeHtml(
        bodyContent(),
        {
            allowedTags: false,
            allowedAttributes: false,
            allowedAttributes: {
              a: [ 'href', 'name', 'target' ],
              img: [ 'src' ]
            },
            allowedSchemes: [
                'https',
                'mailto'
            ],
            exclusiveFilter: function(frame) {
                if ( frame.tag === 'style' ||
                     frame.tag === 'script' ||
                     frame.tag === 'link' ||
                     frame.tag === 'noscript' ||
                     frame.tag === 'iframe' ||
                     frame.tag === 'frame'
                    )
                {
                    return !frame.text.trim();
                }
            }
        }
    );

    function createHTML() {

        const newHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                ${cssStyles}
                </style>
                <script>${ vmJs }</script>
            </head>
                ${ cleanBody }
            </html>
        `;

        fs.writeFile(`${finalRoute}/index.html`, newHTML, function(err) {
            if(err) {
                next(err);
                return;
            }
            next();
        });
    }

    fs.readFile(`${finalRoute}/js/bundle.js`, 'utf8', function(err, jsContent) {
        try {
            vm.run(jsContent);
            vmJs = jsContent;
        } catch (err) {
            console.error('Failed to execute script.', err);
            if(err) {
                next(err);
                return;
            }
        }
        createHTML();
    });

});

router.post('/', (req, res, next) => {

    const data = req.body;
    data.exerciseFolder = exerciseName;
    const exercise = new Exercise(data);

    exercise.save((err) => {
        if(err) {
            next(err);
            return;
        }

        rimraf(tmpFolder, (err) => {
            if(err) {
                next(err);
                return;
            }
            res.send(data);
        });
    });

});

module.exports = router;
