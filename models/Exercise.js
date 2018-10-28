'use strict';

const mongoose = require('mongoose');

const exerciseSchema = mongoose.Schema({
    unitName: String,
    exerciseName: String,
    exerciseState: String,
    exerciseDate: Date
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;