'use strict';

const express = require('express');
const router = express.Router();
const Exercise = require('../../models/Exercise');

router.get('/exercises', (req, res, next) => {
    Exercise.find()
        .exec()
        .then((exercise) => res.json(exercise))
        .catch((err) => next(err));
});

router.get('/exercise/:exerciseFolder', async(req, res, next) => {
    Exercise.findOne({'exerciseFolder': req.params.exerciseFolder})
        .exec()
        .then((exercise) => res.json(exercise))
        .catch((err) => next(err));
});

router.delete('/exercise/:exerciseFolder', async(req, res, next) => {
    Exercise.findOneAndRemove({'exerciseFolder': req.params.exerciseFolder})
        .exec()
        .then((exercise) => res.json(exercise))
        .catch((err) => next(err));
});

module.exports = router;