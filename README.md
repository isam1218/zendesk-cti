# Zendesk Repo

## Instructions:
git clone the repo
npm install from root directory

To Test locally in browser (without zendesk environment):
1. npm start from root directory
2. navigate to localhost:8080

To Build: 
1. from root directory, in command line type 'npm run build' -> this should output a new bundle.js file in app/assets directory

To test locally in zendesk environment: 
0. build app so bundle.js file exists in app/assets directory
1. from command line, navigate to /app directory
2. start zat server by running the command  'zat server' from the command line
3. in browser, navigate (and log in) to your zendesk dashboard sandbox environment (https://fonality1406577563.zendesk.com/agent/)
4. append "?zat=true" to the end of zendesk url in the browser
5. click on shield icon in the url bar (can only test and use on chrome and firefox since requires the loading of unsafe scripts)
6. click "load unsafe scripts"
7. on the top bar of browser window, click on the refresh button to reload the app w/ latest changes
8. click on icon and Fonality CTI modal should pop up over zendesk page
