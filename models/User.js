const mongoose = require('mongoose');

const usuarioSchema = mongoose.Schema({
    firstNme:  {
        type: String,
        required: 'Please supply a name',
        trim: true,
        default: ''
    },
    LasttNme:  {
        type: String,
        required: 'Please supply a name',
        trim: true,
        default: ''
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: 'Please supply an email address',
        default: ''
    },
    password:  {
        type: String,
        required: 'Please supply a password',
        trim: true,
        default: ''
    },
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
module.exports = Usuario;