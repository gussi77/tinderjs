'use strict';

const TINDER_HOST = "https://api.gotinder.com";
const request = require('request-promise');

const _xAuthTokenSymbol = Symbol();
const _userIdSymbol = Symbol();
const _defaultsSymbol = Symbol();
const _lastActivitySymbol = Symbol();

class Tinderjs {
    constructor() {
        this[_lastActivitySymbol] = new Date();
    }

    get isAuthorized() {
        return this[_xAuthTokenSymbol] != null;
    }

    /**
     * Returns the xAuthToken
     * @return xAuthToken
     */
    get authToken() {
        return this[_xAuthTokenSymbol] || null;
    }


    /**
     * Returns client information and globals
     * Globals are used for interacting with tinder api limits
     */
    get defaults() {
        return this[_defaultsSymbol];
    }


    /**
     * Helper for getting the request object
     * @param path {String} path the relative URI path
     * @param data {Object} an object of extra values
     */
    getRequestOptions(path, data, method) {
        const options = {
            url: TINDER_HOST + "/" + path,
            json: data
        };

        const headers = {
            'User-Agent': 'Tinder Android Version 2.2.3',
            'os_version': '16'
        };

        if (this[_xAuthTokenSymbol]) {
            headers['X-Auth-Token'] = this[_xAuthTokenSymbol];
        }

        options.headers = headers;

        options.method = method;
        return options;
    };

    /**
     * Issues a POST request to the tinder API
     * @param {String} path the relative path
     * @param {Object} data an object containing extra values
     * @param {Function} callback the callback to invoke when the request completes
     */
    tinderRequest(path, data, method) {
        return request(this.getRequestOptions(path, data, method));
    };


    /**
     * Authorize this tinder client
     * @param {String} fbToken the Facebook token. This will be obtained when authenticating the user
     * @param {String} fbId the Facebook user id.
     * @param {Function} callback the callback to invoke when the request completes
     */
    authorize(fbToken, fbId) {
        const params = {
            facebook_token: fbToken,
            facebook_id: fbId
        };
        return this.tinderRequest('auth', params, 'POST')
            .then((result) => {
                this[_xAuthTokenSymbol] = result.token;
                this[_userIdSymbol] = result.user._id;
                this[_defaultsSymbol] = result;

                return result;
            })
            .catch((err) => {
                throw "Failed to authenticate: " + err.error;
            });
    };

    /**
     * Gets a list of profiles nearby
     * @param {Number} limit the maximum number of profiles to fetch
     * @param {Function} callback the callback to invoke when the request completes
     */
    getRecommendations(limit) {
        return this.tinderRequest('user/recs', {limit: limit}, 'GET');
    };

    /**
     * Updates the position for this user
     * @param {Number} lon the longitude
     * @param {Number} lat the latitutde
     * @param {Function} callback the callback to invoke when the request completes
     */
    updatePosition(lon, lat) {
        const coords = {
            lon: lon,
            lat: lat
        };
        return this.tinderRequest('user/ping', coords, 'POST');
    };

    /**
     * Sends a message to a user
     * @param {String} userId the id of the user
     * @param {String} message the message to send
     * @param {Function} callback the callback to invoke when the request completes
     */
    sendMessage(userId, message, callback) {
        return this.tinderRequest('user/matches/' + userId, {message: message}, 'POST');
    };

    /**
     * Swipes left for a user
     * @param {String} userId the id of the user
     * @param {Function} callback the callback to invoke when the request completes
     */
    pass(userId) {
        return this.tinderRequest('pass/' + userId, null, 'GET');
    };

    /**
     * Swipes right for a user
     * @param {String} userId the id of the user
     * @param {Function} callback the callback to invoke when the request completes
     */
    like(userId) {
        return this.tinderRequest('like/' + userId, null, 'GET');
    };

    /**
     * Gets a list of new updates. This will be things like new messages, people who liked you, etc.
     * @param {Function} callback the callback to invoke when the request completes
     */
    getUpdates() {
        return this.tinderRequest('updates', {last_activity_date: this[_lastActivitySymbol].toISOString()}, 'POST')
            .then((result)=> {
                this[_lastActivitySymbol] = new Date();
                return result;
            });

    };

    /**
     * Gets the entire history for the user (all matches, messages, blocks, etc.)
     *
     * NOTE: Old messages seem to not be returned after a certain threshold. Not yet
     * sure what exactly that timeout is. The official client seems to get this update
     * once when the app is installed then cache the results and only rely on the
     * incremental updates
     * @param {Function} callback the callback to invoke when the request completes
     */
    getHistory() {
        return this.tinderRequest('updates', {last_activity_date: ""}, 'POST');
    };

    /**
     * Get user by id
     * @param {String} userId the id of the user
     * @param {Function} callback the callback to invoke when the request completes
     */
    getUser(userId) {
        return this.tinderRequest('user/' + userId, null, 'GET');
    };


}
exports = module.exports = Tinderjs;
