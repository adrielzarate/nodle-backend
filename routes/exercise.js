const express = require('express');
const router = express.Router();
const dir = require('node-dir');
const concat = require('concat');
const compressor = require('node-minify');

router.get('/:exerciseFolder', (req, res, next) => {

    const exerciseFolder = req.params.exerciseFolder;

    res.send('you are in the page exercises ' + exerciseFolder);

});

module.exports = router;
