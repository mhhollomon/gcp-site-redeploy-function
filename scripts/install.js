#!/usr/bin/env node

const { spawnSync } = require('child_process');

const fs = require("fs");
const yaml = require("js-yaml");

const PHASE = {
    workflow : 'workflow',
    trigger  : 'trigger',
    apis     : 'apis',
    function : 'function',
};

const phases_config = {
    'all' : [ PHASE.workflow, PHASE.apis, PHASE.trigger, PHASE.function],
    'workflow' : [ PHASE.workflow ],
    'apis'     : [ PHASE.apis ],
    'trigger'  : [ PHASE.trigger ],
    'function'  : [ PHASE.function ],
};

const config_required_keys = {
    REPOSITORY : { 'LOCAL_REPO_PATH': {} },
    DEPLOYER   : { 'NAME' : {}, 'WEBHOOK_URL' : {} },
    HOSTING    : { 'PROVIDER' : {} },
    SCHEDULER  : {},
    EMAIL      : { 'PROVIDER' : {} },
};

// A map of the phases that the user asked for
let gPhases = {};

// Configuration values;
let gConfig;

function validate_config(config, prefix, key_set) {
    let error_count = 0;
    if (typeof prefix === 'undefined') {
        prefix = '';
    }
    if (typeof key_set === 'undefined') {
        key_set = config_required_keys;
    }

    for (key in key_set) {
        if (prefix === '') {
            current_path = key;
        } else {
            current_path = prefix + '.' + key;
        }
        if ( key in config ) {
            error_count += validate_config(config[key], current_path, key_set[key]);
        } else {
            error_count += 1;
            console.error(`ERROR: config missing key path ${current_path}`);
        }
    }

    return error_count;
}

function run_gcloud(args) {
    console.log(`running gcloud ${args.join(" ")}`);
    const retval = spawnSync('gcloud', args);

    console.log(`stderr = ${retval.stderr}`);
    console.log(`stdout = ${retval.stdout}`);

    if (typeof retval.error !== 'undefined') {
        throw(`Error running gcloud : ${retval.error}`);
    }

    if (retval.status != 0) {
        throw(`gcloud reports an error: ${retval.stderr}`);
    }

    console.log(retval.stdout);

    return true;
}

//
// ---------------- MAIN ------------------------------------------
//
// Check command line arguments
{
    let install_args = process.argv.slice(2);

    console.log(install_args);
    if (install_args.length < 1 ) {
        console.log("Defaulting to 'all' phase");
        install_args[0] = 'all';
    }

    for (arg of install_args) {
        if (arg in phases_config) {
            for ( p of phases_config[arg] ) {
                gPhases[p] = 1;
            }
        } else {
            console.error(`Error: unknown install phase ${arg}`);
            return 1;
        }
    }
}

//
// Read and validate the config file
//
try {
    gConfig = yaml.safeLoad(fs.readFileSync('./install_cfg.yml', 'utf8'));
    console.log(gConfig);
    if (validate_config(gConfig) > 0) {
        throw("Config file is not valid");
    }
} catch (e) {
    console.log(e);
    return 1;
}

let vrbl_map = {
    'BUCKET_URI' : "gs://" + gConfig['BUCKET_NAME'],
    'DS_FILE_NAME' : gConfig['DS_FILE_NAME']
};

//
// WORKFLOW
//
if (PHASE.workflow in gPhases) {

    let workflow;

    console.info("Writing schedule-redeploy workflow");
    try {
        workflow = fs.readFileSync('workflows/schedule-redeploy.yml', 'utf8');

        for (vrbl of [ 'BUCKET_URI', 'DS_FILE_NAME' ] ){
            let target = '%{' + vrbl + '}%';
            let new_value = vrbl_map[vrbl];
            workflow = workflow.replace(target, new_value);
        }

        fs.writeFileSync(
            gConfig['REPOSITORY']['LOCAL_REPO_PATH'] + '/.github/workflows/schedule-redeploy.yml', 
            workflow)
    } catch(e) {
        console.log(e);
        return 1;
    }

    if (gConfig['DEPLOYER']['NAME'].toUpperCase() === 'GITHUB' && 
        gConfig['HOSTING']['PROVIDER'].toUpperCase() === 'FIREBASE') {
        
        console.info("Writing firebase-deploy workflow");

        try {
            workflow = fs.readFileSync('workflows/firebase-deploy.yml', 'utf8');
            fs.writeFileSync(
                gConfig['REPOSITORY']['LOCAL_REPO_PATH'] + '/.github/workflows/firebase-deploy.yml', 
                workflow)
        } catch(e) {
            console.log(e);
            return 1;
        }
    }
}


//
// APIs
//

if (PHASE.apis in gPhases) {
    for (api of [ 'cloudfunctions.googleapis.com', 'cloudscheduler.googleapis.com' ] ) {
        run_gcloud( [
            'services', 'enable', api,
            '--project', gConfig['SCHEDULER']['PROJECT_ID']
        ]);
    }

    try {
        run_gcloud([ 'app', 'create', `--region=${gConfig['SCHEDULER']['REGION']}`, 
            '--project', gConfig['SCHEDULER']['PROJECT_ID'] ]);
    } catch(e) {
        // That string means we created it earlier, so ignore the error.
        if (! e.match('already contains an')) {
            throw(e);
        }
    }
}

//
// Function
//
if (PHASE.function in gPhases) {
    args = [
        'functions', 'deploy', gConfig['SCHEDULER']['FUNCTION_NAME'],
            '--source', 'src',
            '--runtime', 'nodejs10',
            '--trigger-topic', gConfig['SCHEDULER']['TRIGGER_TOPIC'],
            '--project', gConfig['SCHEDULER']['PROJECT_ID']
    ];

    run_gcloud(args);
}
//
// Trigger
//
if (PHASE.trigger in gPhases) {
    // run with --quiet so that it will create the app engine in the project
    // if needed.
    run_gcloud([
            'scheduler', 'jobs', 'create', 'pubsub', gConfig['SCHEDULER']['TRIGGER_NAME'],
            '--project', gConfig['SCHEDULER']['PROJECT_ID'],
            '--time-zone=America/New_York', `--topic=${gConfig['SCHEDULER']['TRIGGER_TOPIC']}`,
            '--schedule=10 5 * * *', '--quiet',
            '--message-body={}', '--description=trigger the redeploy function'
    ]);
}
