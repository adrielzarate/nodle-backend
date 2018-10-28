'use strict';

const mongoose = require('mongoose');
const conn = mongoose.connection;

conn.on('err', err => {
    if(err) throw new Error('Hubo un error',  err);
    process.exit(1);
});

conn.once('open', () => {});

mongoose.connect('mongodb://localhost/nodle', { useNewUrlParser: true });