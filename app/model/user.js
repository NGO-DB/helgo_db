PREFIX_USER = "user:";

angular.module('myApp.user', [
    'myApp.appDB',
])

    .factory('User', ['appDB', function ($log, appDB) {
        function User(data) {
            if (data) {
                this.setData(data);
                this._id = PREFIX_USER+data.name;
            }
        };

        User.prototype = {
            setData: function (data) {
                angular.extend(this, data);
                return this;
            },
            delete: function () {
                appDB.delete(this);
            },
            update: function () {
                appDB.put(this);
            },

            authenticate: function(password) {
                return (hashFnv32a(password) == this.password);
            },
        };

        return User;
    }])


    .factory('userManager', ['appDB', 'DbManager', '$q', 'User', function (appDB, DbManager, $q, User) {
        var prefix = PREFIX_USER;
        var manager = new DbManager(PREFIX_USER, User);

        angular.extend(manager, {
            _currentUser: null,

            /* Public Methods */

            login: function(username, password) {
                var deferred = $q.defer();
                var scope = this;

                appDB.login(username, password);

                this.get(username).then(
                    function(user) {
                        if(user.authenticate(password)) {
                            scope._currentUser = user;
                            deferred.resolve({ok: true});
                        }
                        else {
                            deferred.resolve({ok: false, info: "Username or password wrong."});
                        }
                    },
                    function(err) {
                        deferred.reject({ok: false, message: "Username or password wrong."});
                    }
                );
                return deferred.promise;
            },
            logout: function() {
                appDB.logout();
                this._currentUser = null;
            },
            isLoggedIn: function () {
                return (this._currentUser != null);
            },

            getAllSocialworkers: function () {
                return this.getAll().then(
                    function (users) {
                        var socialworkers = [];
                        users.forEach(function (user) {
                            if (user.socialworker) {
                                socialworkers.push(user);
                            }
                        });
                        return socialworkers;
                    }
                );
            },
        });

        return manager;
    }]);


/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {boolean} [asString=false] set to true to return the hash value as
 *     8-digit hex string instead of an integer
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {integer | string}
 */
function hashFnv32a(str, asString, seed) {
    /*jshint bitwise:false */
    var i, l,
        hval = (seed === undefined) ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if (asString) {
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
}