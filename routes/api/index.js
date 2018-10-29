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

router.get('/exercise/:exerciseName', async(req, res, next) => {
    Exercise.findOne({'exerciseName': req.params.exerciseName})
        .exec()
        .then((exercise) => res.json(exercise))
        .catch((err) => next(err));
});

router.delete('/exercise/:exerciseName', async(req, res, next) => {
    Exercise.findOneAndRemove({'exerciseName': req.params.exerciseName})
        .exec()
        .then((exercise) => res.json(exercise))
        .catch((err) => next(err));
});

module.exports = router;