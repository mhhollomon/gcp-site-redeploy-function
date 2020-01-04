import * as req_prom from 'request-promise-native';
import {Mutex} from 'async-mutex';

const token_req_uri = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

const cache_mutex = new Mutex();
let token_cache;
let token_expiry;

export async function get_token() {
    let release = await cache_mutex.acquire();

    try {
        if (token_cache) {
            if (Math.floor(Date.now()/1000) < token_expiry) {
                console.log("reusing auth token");
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
        .then(async (data) => { 
            let release = await cache_mutex.acquire();

            // be conservative. assume it expires a second before the API
            // says it will.
            token_expiry = Math.floor(Date.now()/1000) + data.expires_in - 1;
            token_cache = data.access_token;

            release();

            return Promise.resolve(data.access_token); 
        });
};
