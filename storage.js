// Initialize Firebase
var config = {
      apiKey: "AIzaSyBW2fPQzgophaWJaevGndcgFbbJhvZqnFs",
      authDomain: "sworm-1.firebaseapp.com",
      databaseURL: "https://sworm-1.firebaseio.com",
      projectId: "sworm-1",
      storageBucket: "",
      messagingSenderId: "610479094350"
};
firebase.initializeApp(config);

// Retourne l'état du monde tel que sur Firebase
function GetWorld() {
  return firebase.database()
                 .ref("world")
                 .once('value')
                 .then(function(snapshot) {
    return snapshot.val();
  });
}

// SubscribNewWorld pour être notifié du changement du monde
function SubscribNewWorld(cb) {
  return firebase.database()
                 .ref("world")
                 .on('value', function(value){
    cb(value.val());
  });
}

// Set l'état du monde sur Firebase.
function SendWorld(world) {
  firebase.database()
          .ref("world")
          .set(world);
}

// SendAction envoie l'action au serveur
function SendAction(username, action) {
  firebase.database()
          .ref("actions/" + username)
          .set(action);
}

// Retourne les actions à simuler.
function GetActions() {
  return firebase.database()
                 .ref("actions")
                 .orderByChild('time')
                 .once('value')
                 .then(function(snaptshot) {
    return snaptshot.val();
  });
}

// SubscribActions pour être notifié du changement du monde
function SubscribActions(cb) {
  return firebase.database()
                 .ref("actions")
                 .on('value', function(value){
    cb(value.val());
  });
}

// PurgeActions supprime toutes les actions
function PurgeActions() {
  firebase.database()
          .ref("actions")
          .set({});
}
