// load all the things we need
var FB = require('fb');
var FacebookStrategy = require('passport-facebook').Strategy;

// load up the user model
var User            = require('../models/user');

// load the auth variables
var configAuth = require('../config/auth');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    
    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebook.clientID,
        clientSecret    : configAuth.facebook.clientSecret,
        callbackURL     : configAuth.facebook.callbackURL

    },

    // facebook will send back the token and profile
    function(token, refreshToken, profile, done) {
        
        FB.setAccessToken(token);

        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            User.findOne({ _id : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    // update user access token in the database
                    user.facebook.token = token;
                    
                    FB.api('/me', { fields: 'picture' }, function(records) {
                        if (records) {
                            console.log(records);
                            if (records.picture && records.picture.data && records.picture.data.url) {
                                user.facebook.picture = records.picture.data.url;
                            }
                        }
                    });
                    
                    FB.api('/me/accounts', { locale: 'pt_BR', fields: ['id', 'name', 'access_token', 'category', 'category_list', 'perms'] }, function(records) {
                        if (records) {
                            user.fanpages = records.data;
                        }
                        
                        user.save(function(err) {
                            if (err)
                                throw err;

                            // user found, return that user
                            return done(null, user);
                        });
                    });
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser            = new User();

                    // set all of the facebook information in our user model
                    newUser._id    = profile.id; // set the users facebook id                   
                    newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                    newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                    
                    newUser.facebook.picture = '/img/user.png';
                    
                    FB.api('/me', { fields: 'picture' }, function(records) {
                        if (records) {
                            if (records.picture && records.picture.data && records.picture.data.url) {
                                newUser.facebook.picture = records.picture.data.url;
                            }
                        }
                    });
                    
                    if (profile.emails && profile.emails.length && profile.emails.length > 0) {
                        newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                    }
                    
                    FB.api('/me/accounts', { locale: 'pt_BR', fields: ['id', 'name', 'access_token', 'category', 'category_list', 'perms'] }, function(records) {
                        if (records) {
                            newUser.fanpages = records.data;
                        }
                        
                        // save our user to the database
                        newUser.save(function(err) {
                            if (err)
                                throw err;

                            // if successful, return the new user
                            return done(null, newUser);
                        });
                    });
                }
            });
        });

    }));
    
};