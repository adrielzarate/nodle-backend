// const mongoose = require('mongoose');
// const Admin = mongoose.model('Admin');

exports.getHomeAdmin = async (req, res) => {
    res.render('home', { title: 'Stores' });
};