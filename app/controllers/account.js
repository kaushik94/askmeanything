//
// Account Controller
//

module.exports = function() {

    var _ = require('underscore');

    var app = this.app,
        middlewares = this.middlewares,
        models = this.models;

    //
    // Routes
    //
    app.get('/', middlewares.requireLogin, function(req, res) {
        res.render('chat.html', {
            account: req.user.toJSON()
        });
    });
    app.get('/login', function(req, res) {
        res.render('login.html');
    });
    app.post('/account/login', function(req, res) {
        req.io.route('account:login');
    });
    // TODO: you should be POST'ing to DELETE'ing this resource
    app.get('/account/logout', function(req, res) {
        req.io.route('account:logout');
    });
    app.post('/account/register', function(req, res) {
        req.io.route('account:register');
    });

    //
    // Sockets
    //
    app.io.route('account', {
        whoami: function(req) {
            req.io.respond(req.user);
        },
        register: function(req) {
            var fields = req.body || req.data;
            models.user.create({
                email: fields.email,
                password: fields.password,
                firstName: fields.firstName || fields.firstname || fields['first-name'],
                lastName: fields.lastName || fields.lastname || fields['last-name'],
                displayName: fields.displayName || fields.displayname || fields['display-name']
            }, function(err, user) {
                // Did we get error?
                if (err) {
                    var message = 'Sorry, we could not process your request';
                    // User already exists
                    if (err.code == 11000) {
                        message = 'Email has already been taken';
                    }
                    // Invalid username
                    if (err.errors) {
                        message = _.map(err.errors, function(error) {
                            return error.message;
                        }).join(' ');
                    }
                    // Notify
                    req.io.respond({
                        status: 'error',
                        message: message
                    }, 400);
                    return;
                }
                // AWWW YISSSSS!
                req.io.respond({
                    status: 'success',
                    message: 'You\'ve been registered, please try logging in now!'
                }, 201);
            });
        },
        login: function(req) {
            var fields = req.body || req.data;
            models.user.authenticate(fields.email, fields.password, function(err, user) {
                if (err) {
                    // Something bad
                    req.io.respond({
                        status: 'error',
                        message: 'An error occured while trying to log you in'
                    }, 400);
                    return;
                }
                if (user && user) {
                    // Hello user <3
                    req.session.userID = user._id;
                    req.session.save(function() {
                        req.io.respond({
                            status: 'success',
                            message: 'You\'ve been logged in!'
                        });
                    });
                    return;
                }
                // NOPE!
                req.io.respond({
                    status: 'error',
                    message: 'Could not log you in'
                }, 401);
            });
        },
        logout: function(req) {
            req.session.destroy();
            req.io.respond({
                status: 'succcess',
                message: 'Session deleted'
            }, 200);
        }
    });
}