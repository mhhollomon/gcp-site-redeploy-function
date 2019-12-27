const req_prom  = require('request-promise-native');
const Mutex = require('async-mutex');

const token_req_uri = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

const cache_mutex = new Mutex();
var token_cache;
var token_expiry;

//
// This is broken. If we ask for the token again before
// the first promise resolves, we will ask again and then
// overwrite. Need to add a mutex of some kind.
//
exports.get_token = async () => {
    var release = await cache_mutex.aquire();

    try {
        if (token_cache) {
            if (Math.floor(Date.now()/1000) < token_expiry) {
                return Promise.resolve(token_cache);
            } else {
                token_cache = undefined;
            }
        }
    } finally {
        release();
    }

    return req_prom.get(token_req_uri,
        {
            "headers" : {
                "Metadata-Flavor": "Google"
            },
            json: true
        })
        .then((data) => { 
            var release = await cache_mutex().aquire();

            // be conservative. assume it expires a second before the API
            // says it will.
            token_expiry = Math.floor(Date.now()/1000) + data.expires_in - 1;
            token_cache = data.access_token;

            release();

            return Promise.resolve(data.access_token); 
        });
};
