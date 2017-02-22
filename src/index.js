import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';
import LoginWindow from './components/login';
import fdp from './components/fdp.js';
// import css from '../style/main.less';

// required settings
var settings = {
	display_name: '',
	current_location: 'self',
	ringing_volume: '1', 
	hudmw_webphone_mic: '0.5',
	hudmw_webphone_speaker: '0.5',
	chat_status: 'offline', 
	chat_custom_status: '',
	alwaysOnTop: false,
	coords: {},
	devices: {input:[], output:[]},
};

// temp location for config name
// var configName = "Fonality Zendesk CTI";
var server = "https://dev4.fon9.com:8081";

// other feed data
// var quickinbox = {};
var locations = {};
var avatars = {};
var mycalls = [];
var calllog = [];
var queue_members_status = [];
var queues = [];
var queue_members = [];
var queuelogoutreasons = [];
var members_status = [];
var match = false;


 // must be array to facilitate sorting

// managing data changed by sync to update state which will be passed down
var reset = fdp.emitter.addListener('logout', () => {
	locations = {};
	avatars = {};
	mycalls = [];
	calllog = [];
	queue_members_status = [];
	queues = [];
	queue_members = [];
	queuelogoutreasons = [];
	members_status = [];
	match = false;
	});
var dataListener = fdp.emitter.addListener('data_sync_update', (data) => {
	/**
		USER SETTINGS
	*/
	

	if (data['me']) {		
		for (let i = 0; i < data['me'].length; i++)
			settings[data['me'][i].propertyKey] = data['me'][i].propertyValue;
		
	}

	if(data['calllog']){
		for (let i = 0; i < data['calllog'].length; i++)
			calllog.push(data['calllog'][i]);
	}

	if(data['queue_members_status']){
		
		
		for (let i = 0; i < data['queue_members_status'].length; i++){
			
			
			//members_status[i] = data["queue_members_status"][i];
			for (let z = 0; z < members_status.length;z++){


			if(members_status[z].xpid == data['queue_members_status'][i].xpid){
					
					members_status[z] = data['queue_members_status'][i];
				 	match = true;
				}


			}
					 

			if (!match) {
				members_status.push(data['queue_members_status'][i]);
				queue_members_status = members_status;
			}


		}


	}
	if(data['queues']){
		for (let i = 0; i < data['queues'].length; i++){
			var queueList = data['queues'][i];
		queues[i] = queueList;
		}
	}
	if(data['queue_members']){
		for (let i = 0; i < data['queue_members'].length; i++){
			var members = data['queue_members'][i];
			queue_members[i] = members;
		}
	}
	if(data['queuelogoutreasons']){
		queuelogoutreasons = [];
		for (let i = 0; i < data['queuelogoutreasons'].length; i++){
			var logoutreasons = data['queuelogoutreasons'][i];
			queuelogoutreasons[i] = logoutreasons;
		}
	}
	
	if (data['settings']) {		
		for (let i = 0; i < data['settings'].length; i++)
			settings[data['settings'][i].key] = data['settings'][i].value;
		
	}


	/**
		AVATARS
	*/
	if (data['fdpImage']) {
		for (let i = 0; i < data['fdpImage'].length; i++) {
			var img = data['fdpImage'][i];
      var remote = `${server}/v1/contact_image?pid=${img.xpid}&w=90&h=90&Authorization=${localStorage.auth}&node=${localStorage.node}&xver=${img.xef001iver}`;
			// find mine
			if (img.xpid == settings.my_pid) {
				// https://dev4.fon9.com:8081/v1/contact_image?pid=1000015ad_1905460&w=90&h=90&Authorization=b4e0bc504a6975c5a749942b812d811de2994b484e24401b&node=fdp2.dev4.fon9.com&xver=2773840
        // store url on settings
        settings.icon_url = remote;
			}
			else
				avatars[img.xpid] = remote;
		}
	}


	/**
		CALLS
	*/
	if (data['mycalls']) {
		processCalls(data['mycalls']);
	}
	
	if (data['mycalldetails']) {		
		// attach details to each call
		for (let i = 0; i < data['mycalldetails'].length; i++) {
			var details = data['mycalldetails'][i];
			
			for (let j = 0; j < mycalls.length; j++) {
				if (details.xpid == mycalls[j].xpid) {
					mycalls[j].details = details;
					break;
				}
			}
		}
	}


	/**
		LOCATIONS
	*/
	if (data['locations']) {
		locations = {};
		for (let i = 0; i < data['locations'].length; i++) {
			var location = data['locations'][i];
			
			if (location.xef001type != 'delete') {
				// don't show mobile
				if (location.shortName == 'Mobile') {
					location.name = 'Mobile';
					location.hidden = true;
				}
				// change web name
				// else if (location.shortName == 'Web')
				// 	location.name = configName;
				
				location.status = {};
				locations[location.xpid] = location;
			}
			else
				delete locations[location.xpid];
		}
	}
	
	if (data['location_status']) {
		// attach details to each location
		for (let i = 0; i < data['location_status'].length; i++) {
			var status = data['location_status'][i];
			
			if (locations[status.xpid]) {
				locations[status.xpid].status = status;
			
				// hard-code mobile devices to registered
				if (locations[status.xpid].locationType == 'm')
					locations[status.xpid].status.deviceStatus = 'r';
			}
		}
	}


  ReactDOM.render(<App settings={settings} avatars={avatars} mycalls={mycalls} locations={locations} calllog={calllog} queue_members={queue_members} queue_members_status={queue_members_status} queues={queues} queuelogoutreasons={queuelogoutreasons} />, document.querySelector('.container'));
});



ReactDOM.render(<App settings={settings} avatars={avatars} mycalls={mycalls} locations={locations} calllog={calllog} queue_members={queue_members} queue_members_status={queue_members_status} queues={queues} queuelogoutreasons={queuelogoutreasons} />, document.querySelector('.container'));

function processCalls(calls) {
	var oldLength = mycalls.length;
	
	for (let i = 0; i < calls.length; i++) {
		var call = calls[i];
		var found = false;

		// fix name
		if (call.displayName !== undefined)
			call.displayName = call.displayName.replace(/^(9|91|1)-/, '');
		
		// adjust fdp timestamps
		if (call.xpid) {
			call.created += parseInt(sessionStorage.timeShift);
			call.holdStart += parseInt(sessionStorage.timeShift);
		}
		else
			call.locationId = settings.current_location;
		
		for (let j = 0; j < mycalls.length; j++) {
			// fdp
			if (call.xpid && call.xpid == mycalls[j].xpid) {
				if (call.xef001type != 'delete') {	
					// update
					mycalls[j] = call;
				}
				else {						
					// delete record
					mycalls.splice(j, 1);
				}
				
				found = true;
				break;
			}
			// softphone direct
			else if (call.sipId == mycalls[j].sipId) {
				if (call.state != 1) {
					// update
					mycalls[j].state = call.state;
					
					if (call.holdStart)
						mycalls[j].holdStart = call.holdStart;
				}
				else {
					//delete
					mycalls.splice(j, 1);
				}
				
				found = true;
				break;
			}
		}
		
		if (!found && call.displayName !== undefined){
			mycalls.push(call);
		}
	}
	
	if (mycalls.length > 1) {
		// re-sort calls
		mycalls = mycalls.sort((a, b) => {
			// active first
			if (a.state == 2)
				return -1;
			else if (b.state == 2)
				return 1;
			// then holding
			else if (a.state == 3 && b.state == 3) {
				return b.holdStart - a.holdStart;
			}
			// then incoming
			else
				return b.created - a.created;
		});
	}
	
	// new call, so re-display app
	if (mycalls.length > oldLength){
    // render call component
		// openAppWindow();
  }
}