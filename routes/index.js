var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require('passport');

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/profile', isLoggedIn, function(req, res, next) {
    userModel
        .findOne({ username: req.session.passport.user })
        .populate("posts")
        .then(function(foundUser) {
            console.log(foundUser);
            res.render("profile", { foundUser })
        })
});

router.get('/like/:postid', isLoggedIn, function(req, res, next) {
    userModel
        .findOne({ username: req.session.passport.user })
        .then(function(user) {
            postModel
                .findOne({ _id: req.params.postid })
                .then(function(post) {
                    if (post.likes.indexOf(user._id) === -1) {
                        post.likes.push(user._id);
                    } else {
                        post.likes.splice(post.likes.indexOf(user._id), 1);
                    }

                    post.save()
                        .then(function() {
                            res.redirect("back");
                        })
                })
        })
});

router.post('/post', isLoggedIn, function(req, res, next) {
    userModel
        .findOne({ username: req.session.passport.user })
        .then(function(user) {
            postModel.create({
                    userid: user._id,
                    data: req.body.post
                })
                .then(function(post) {
                    user.posts.push(post._id);
                    user.save()
                        .then(function() {
                            res.redirect("back");
                        })
                })
        })
});

router.get('/feed', isLoggedIn, function(req, res, next) {
    userModel.findOne({ username: req.session.passport.user })
        .then(function(user) {
            postModel
                .find()
                .populate("userid")
                .then(function(allposts) {
                    res.render("feed", { allposts, user });
                });
        })
});

router.get('/login', function(req, res, next) {
    res.render("login");
});

router.get('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

router.post('/login', passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login"
}), function(req, res, next) {});

router.post('/register', function(req, res, next) {
    userModel.findOne({ username: req.body.username })
        .then(function(foundUser) {
            if (foundUser) {
                // will run if there is some user
                res.send("username already exists");
            } else {
                // will run if there is no use with same username
                var newuser = new userModel({
                    username: req.body.username,
                    age: req.body.age,
                    email: req.body.email,
                    image: req.body.image,
                });

                userModel.register(newuser, req.body.password)
                    .then(function(u) {
                        passport.authenticate("local")(req, res, function() {
                            res.redirect("/profile");
                        })
                    });
            }
        });
});


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect("/login");
    }
}

module.exports = router;