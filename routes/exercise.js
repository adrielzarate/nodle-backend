const express = require('express');
const router = express.Router();

router.get('/:exerciseFolder', (req, res, next) => {
    const exerciseFolder = req.params.exerciseFolder;
    res.render(exerciseFolder);
});

module.exports = router;
