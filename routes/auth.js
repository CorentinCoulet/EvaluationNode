const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto-js');
const dotenv = require('dotenv');

dotenv.config();

const secret = process.env.SECRET;

router.get('/register', (req, res) => {
    res.render('register', { error_msg: req.flash('error_msg') });
});

router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        req.flash('error_msg', 'Tous les champs sont requis !');
        return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
        req.flash('error_msg', 'Les mots de passe ne correspondent pas !');
        return res.redirect('/auth/register');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        req.flash('error_msg', 'L\'utilisateur existe déjà !');
        return res.redirect('/auth/register');
    }

    const hashedPassword = crypto.HmacSHA256(password, secret).toString(crypto.enc.Hex);

    const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword
    });

    await newUser.save();

    req.flash('success_msg', 'Vous êtes à présent enregistré, vous pouvez vous connecter !');
    res.redirect('/auth/login');
});

router.get('/login', (req, res) => {
    res.render('login', { error_msg: req.flash('error_msg') });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('error_msg', 'Tous les champs sont requis !');
        return res.redirect('/auth/login');
    }

    const user = await User.findOne({ email });

    if (!user) {
        req.flash('error_msg', 'L\'utilisateur n\'existe pas.');
        return res.redirect('/auth/login');
    }

    const hashedPassword = crypto.HmacSHA256(password, secret).toString(crypto.enc.Hex);

    if (hashedPassword !== user.password) {
        req.flash('error_msg', 'Paramètres invalides');
        return res.redirect('/auth/login');
    }

    req.session.userId = user._id;
    req.session.user = user;
    req.flash('success_msg', 'Connecté avec succès !');
    res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
    res.cookie('temp_success_msg', 'Vous avez été déconnecté avec succès.', { maxAge: 1000 * 60 });
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la destruction de la session :', err);
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

module.exports = router;
