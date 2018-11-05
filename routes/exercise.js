const express = require('express');
const router = express.Router();
const dir = require('node-dir');
const concat = require('concat');
const compressor = require('node-minify');

const {NodeVM} = require('vm2');

const vm = new NodeVM({
    require: {
        external: true
    }
});

router.get('/:exerciseFolder', (req, res, next) => {


    const exerciseFolder = req.params.exerciseFolder;
    const routeExcercises = `${__dirname}/../exercises/${exerciseFolder}`;
    const scriptPath = `${routeExcercises}/js/bundle.js`;
    console.log('------------', scriptPath);

    try {
        vm.run('require("concat")', scriptPath);
    } catch (err) {
        console.log('err', err);
        next(err);
        return;
    }

    res.send('you are in the page exercises ' + exerciseFolder);

});

module.exports = router;
