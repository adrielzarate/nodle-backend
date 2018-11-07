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

const rename = util.promisify(fs.rename);

const tempZipPath = `${__dirname}/../tempZip`;
let viewsPath = `${__dirname}/../views`;

let exerciseName = '';
let exercisesPublicPath = '';
let exercisesUnzipPath = '';

/**
* Unzip
*/

router.use((req, res, next) => {

    let exerciseFile = req.files.file;
    let uploadedZipFile = `${tempZipPath}/${exerciseFile.name}`;

    exerciseName = req.body.exerciseName.replace(/\s/g, '-').toLowerCase();
    exercisesPublicPath = `${__dirname}/../public/exercises/${exerciseName}`;
    exercisesUnzipName = exerciseFile.name.split('.').slice(0, -1).join('.');
    exercisesUnzipPath = `${tempZipPath}/${exercisesUnzipName}`;

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
            zip.extract(null, tempZipPath, (err) => {
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
        await mkdirp(exercisesPublicPath)
        await Promise.all([
            mkdirp(`${tempZipPath}/js`),
            mkdirp(`${tempZipPath}/css`),
            mkdirp(`${exercisesPublicPath}/img`)
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

    (async () => {
        await Promise.all(arrFiles.map(fileName => {
            fs.rename(`${exercisesUnzipPath}/${fileName}`, `${exercisesPublicPath}/${fileName}`, function (err) {
                if (err) throw err;
            });
        }));
        next();
    })();
});

/**
*  Moving exercise images to the public directory
*/

router.use((req, res, next) => {
    const arrImages = [];

    dir.readFiles(`${exercisesUnzipPath}/img`,
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
                fs.rename(`${exercisesUnzipPath}/img/${imageFile}`, `${exercisesPublicPath}/img/${imageFile}`, function (err) {
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
        input: `${exercisesUnzipPath}/js/**/*.js`,
        output: `${tempZipPath}/js/bundle.js`
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

    dir.readFiles(`${exercisesUnzipPath}/css`, { match: /.css$/, exclude: /^\./ }, function(err, content, filename, next) {
        cssFiles.push(filename);
        next();
    },
    function(err, files){
        if (err) throw err;
        concat(cssFiles, `${tempZipPath}/css/bundle.css`).then( () => {
            next();
        });
    });

});

/**
*  Sanitize HTML
*/

router.use((req, res, next) => {
    const tempHTML = fs.readFileSync(`${exercisesUnzipPath}/index.html`, "utf8");
    const cssStyles = fs.readFileSync(`${tempZipPath}/css/bundle.css`, "utf8");
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

        fs.writeFile(`${viewsPath}/${exerciseName}.ejs`, newHTML, function(err) {
            if(err) {
                next(err);
                return;
            }
            next();
        });
    }

    fs.readFile(`${tempZipPath}/js/bundle.js`, 'utf8', function(err, jsContent) {
        try {
            vm.run(jsContent);
            vmJs = jsContent;
        } catch (er) {
            console.error('Failed to execute script.', er);
            if(er) {
                rimraf(exercisesPublicPath, (err) => console.log(err));
                rimraf(`${tempZipPath}/*`, (err) => console.log(err));
                next(er);
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

        rimraf(`${tempZipPath}/*`, (err) => {
            if(err) {
                next(err);
                return;
            }
            res.send(data);
        });

    });

});

module.exports = router;
