var express = require('express');
const router = express.Router();
const rimraf = require('rimraf');

router.delete('/:exerciseFolder', (req, res, next) => {

    const folderName = req.params.exerciseFolder;
    const publicFolder = `${__dirname}/../public/exercises/${folderName}`;
    const exercisesFolder = `${__dirname}/../exercises/${folderName}`;

    new Promise(
        (resolve, reject) => {
            rimraf(publicFolder, (err) => {
                if(err) throw new Error('Error deleting this file', err);
                resolve('publicFolder removed');
            });
        })
        .then(
            rimraf(exercisesFolder, (err) => {
                if(err) throw new Error('Error deleting this file', err);
                res.send('all removed');
            })
        ).catch((err) => {
            console.log(err);
            next(err);
            return;
        });

});

module.exports = router;