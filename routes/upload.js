var express = require('express');
var router = express.Router();
const StreamZip = require('node-stream-zip');
const rimraf = require('rimraf');
const Exercise = require('../models/Exercise');

router.post('/', (req, res, next) => {

    const data = req.body;

    let exerciseFile = req.files.file;
    let uploadedZipFile = `${__dirname}/../public/exercises/${req.body.filename}`;

    exerciseFile.mv(uploadedZipFile, function(err) {

        if (err) return res.status(500).send(err);

        const zip = new StreamZip({
            file: uploadedZipFile,
            storeEntries: true
        });

        zip.on('ready', () => {
            zip.extract(null, `${__dirname}/../public/exercises/`, (err) => {

                if (err) return res.status(500).send(err);

                rimraf(uploadedZipFile, (err) => {
                    if(err) {
                        next(err);
                        return;
                    }
                });
                rimraf(`${__dirname}/../public/exercises/__MACOSX`, (err) => {
                    if(err) {
                        next(err);
                        return;
                    }
                });

                zip.close();
            });
        });

        data.exercisePath = `${__dirname}/../public/exercises/${req.body.filename}`;

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