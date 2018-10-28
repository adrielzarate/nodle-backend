var express = require('express');
var router = express.Router();
var fs = require('fs');
var unzip = require('unzip');
const Exercise = require('../models/Exercise');

router.post('/', (req, res, next) => {

    const data = req.body;

    let exerciseFile = req.files.file;

    let uploadedZipFile = `${__dirname}/../public/exercises/${req.body.filename}`;

    exerciseFile.mv(uploadedZipFile, function(err) {

        fs.createReadStream(uploadedZipFile).pipe(unzip.Extract({ path: `${__dirname}/../public/exercises/` }));
        fs.unlink(uploadedZipFile, (err) => {
            if (err) {
                next(err);
                return;
            }
        });

        const exercise = new Exercise(data);

        exercise.save((err) => {
            if(err) {
                next(err);
                return;
            }
            res.redirect('/');
        });
    });
});

module.exports = router;