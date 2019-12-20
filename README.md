# gcp-site-redeploy-function

System to redeploy a hugo web site when a future dated post is ready.

[Hugo](https://gohugo.io/) allows the user specify that a peice of content
(e.g. a post) is not to be added as a part of the site until some date in the
future. But Hugo is static generator. So, when that date arrives, something
must regenerate the site and deploy the update to the hosting solution.

For [my blog](https://www.codevamping.com), that "something" was me.

This software is an attempt to automate the task.

## Features

- **Only deploys when required** Minimizes resources.
- **Deploys to Firebase** (Netlify coming soon).
- **Pushes still deploy immediately** No interference with
  "hot-off-the-presses" updates.
- **Supports Hugo extended**

Last, but not least ...

- **Needs a Snappy Name** Time and effort have gone into building.

## Architecture

![Flow Diagram](/docs/flow.png)

1. User pushes content to master branch
2. Github action fires and does two things:
    1. Build the site and deploy.
    2. Update a timestamp in a Google Cloud Storage bucket based on the
       earliest outstanding future-dated post.

_time passes_

1. A GCP Scheduler job publishes to a topic
2. A Cloud Function activates on that topic and
    1. Reads the timestamp from the bucket
    2. If the current date is _after_ the timestamp
        - call back into github to start the actions
    3. Send email about what it did (or did not do).

## Installing

Lots more documentation to come ...

### Things you'll need

#### GitHub Repository

Sure, that might be be obivous, but you need a GitHub repostiry with the site
already et up. It is very helpful if you already have successfully deployed the
your site using the repository. That way you things are okay for hugo to run.

#### Firebase Project

You need to have some place to target in the deploy. Again, it would be very
helpful to already have done at least one deploy to the project to make sure
everything is set up correctly.

#### Google Cloud Platform Project

This will contain Function and Scheduler. Google has a free tier for many of
these services (like it does for Firebase).

Note: The Firebase Project and GCP Project can be the same project.

#### SendGrid Account

If you want to use the email facility, you will need a
[SendGrid](https://sendgrid.com/) Account. They do have a free plan for very
light volumes.

#### Firebase and GCP CLI installed.

You will need to install the CLIs for the two Google products. Instructions are
here:

- [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli)
- [Cloud SDK/CLI](https://cloud.google.com/sdk/install)


### Step 1. Create a Firebase API Key

use the cli, luke.

### Other steps

- Edit `redeploy.json.example` and copy to `redeploy.json`

- Set the following environment variables in your crrent shell
    - GITHUB_AUTH_KEY : A personal access token
    - EMAIL_API_KEY   : The SendGrid API key
    - PROJECT_ID      : The name of your GCP Project

- run `deploy-cmd.sh function` to create the function
- run `deploy-cmd.sh trigger` to create the Scheduler Job
- edit the BUCKET_NAME line in `service_account.sh`
- run the edited `service_account.sh`
- add the github secrets as instructed by the script
- Edit BUCKET_URI in `schedule-redeploy.yml` and copy the workflows to your
  respository.
