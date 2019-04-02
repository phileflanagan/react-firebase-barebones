// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// Get a database reference to our posts
var db = admin.database();
var ref = db.ref("/messages");


// Library to convert JSON to CSV
const json2csv = require("json2csv").parse;

function convertObjForCeltra(obj) {
	for (var key in obj) {
		var oldKey = key;
		var newKey = (oldKey == 'placementName') ? 'condition:' + oldKey :'value:' + oldKey;
		if(!oldKey.startsWith("value:")) {
			Object.defineProperty(obj, newKey, Object.getOwnPropertyDescriptor(obj, oldKey));
			delete obj[oldKey];
		}
	}
}

//Sends a CSV if data exists
exports.getMessage = functions.https.onRequest((req, res) => {
    const messageID = req.query.id;

    // Return if ID not supplied or ill-formatted
    if (!messageID) {
        res.send('Please provide the message ID in the url. Example /getMessage?id=1d9Ejd03jadf932')
    };

    admin.database().ref(`/messages/${messageID}`).on('value', (snapshot) => {
        const messageObj = snapshot.val();

        // Return CSV if found
        if (messageObj) {
            convertObjForCeltra(messageObj);
            const csv = json2csv(messageObj)
            res.setHeader(
                "Content-disposition",
                `attachment; filename=Native-${messageID}.csv`
            )
            res.set("Content-Type", "text/csv")
            res.status(200).send(csv)
        } 
        // Return if no match found
        else {
            res.send('Message not found');
        }
    });

});