'use strict';

const mongoose = require('mongoose');

const exerciseSchema = mongoose.Schema({
    unitName: String,
    exerciseName: String,
    exerciseState: String,
    exerciseDate: Date,
    exercisePath: String
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;