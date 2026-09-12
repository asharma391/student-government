// Copy to config/runtime.local.js ONLY for an independently configured staging project.
// Firebase web config identifies a project; service-account private keys never belong here.
export default {
  mode: "firebase",
  electionId: "staging-election",
  leaderCount: 2,
  representativeCount: 6,
  allowedDomain: "example.edu",
  firebase: {
    apiKey: "YOUR_WEB_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    appId: "YOUR_WEB_APP_ID",
  },
};
