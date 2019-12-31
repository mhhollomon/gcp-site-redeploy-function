const deployer_map = {
    "NONE"    : './null.js',
    "GITHUB"  : "./github.js",
    "NETLIFY" : "./netlify.js"
};

module.exports = class Deployer {
    constructor(target_config) {

        const deployer_key = target_config["NAME"].toUpperCase();
        if (deployer_map[deployer_key]) {
            this.target_ = require(deployer_map[deployer_key]);
        } else {
            throw `Invalid deploy target '${target}'`;
        }

        // at some point, may want to make the sub modules
        // have constructors so that they can validate the config
        // here.

        this.config_ = { ...target_config };
    }

    request_deploy() {
        return this.target_.request_deploy(this.config_);
    }
};
