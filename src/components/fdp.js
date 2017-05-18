import "babel-polyfill";
import "es6-promise/auto";
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import $ from 'jquery';
import {EventEmitter} from 'fbemitter';
import server from '../properties.js';

var obj;
var avatars;
var calllog;
var locations;
var mycalls;
var calls;
var queue_members;
var queue_members_status;
var queuelogoutreasons;
var queues;
var settings;
const emitter = new EventEmitter();

const fdp =  {
	emitter: emitter,
	feeds: ['me', 'settings', 'locations', 'location_status', 'mycalls', 'mycalldetails', 'fdpImage', 'quickinbox','calllog','queue_members_status','queues','queue_members','queuelogoutreasons'],
	synced: false,
	refresh: null,
	status: 0,
	becomeMaster:()=>{
		 
		 if(!fdp.master){
		 	obj = new WindowController(true);

		 }	
		 

		
	},
	xhr:'',
	master:false,
	isMaster:(master)=>{
		fdp.master = master;
		console.log("FDP MASTER",fdp.master);
		if(fdp.synced == false && fdp.master == true){
			
			setTimeout(function(){fdp.login()},3000);
		}
		if(fdp.synced == true && fdp.master == false){
			
			setTimeout(function(){fdp.xhr.abort()},3000);
		}

	 		

	},
	checkMaster:()=>{
		if(!fdp.master){
		if(localStorage.auth != undefined && localStorage.node != undefined && localStorage.refresh != undefined){
			       var checkPromise = new Promise((resolve)=>{
			       avatars= JSON.parse(localStorage.avatars);
			       calllog= JSON.parse(localStorage.calllog);
			       locations= JSON.parse(localStorage.locations);
			       mycalls= JSON.parse(localStorage.mycalls);
			       calls= JSON.parse(localStorage.calls);
			       queue_members= JSON.parse(localStorage.queue_members);
			       queue_members_status= JSON.parse(localStorage.queue_members_status);
			       queuelogoutreasons= JSON.parse(localStorage.queuelogoutreasons);
			       queues= JSON.parse(localStorage.queues);
			       settings= JSON.parse(localStorage.settings);

			       resolve(1);
			   });
			       checkPromise.then((success)=>{
			       	if(success == 1){
			       	 ReactDOM.render(<App settings={settings} avatars={avatars} mycalls={mycalls} locations={locations} calllog={calllog} queue_members={queue_members} queue_members_status={queue_members_status} queues={queues} queuelogoutreasons={queuelogoutreasons} calls={calls} />, document.querySelector('.container'));
			       }
			       }).catch((reason)=>{
			       });
		}
		else{
			fdp.emitter.emit('logout');
		}
		}
	},
	init: () => {
		fdp.login();
	},
	clearCalls: ()=>{
		fdp.emitter.emit('clearCalls');
	},
	logout: ()=>{
		setTimeout(()=>{fdp.xhr.abort()},3000);
		localStorage.clear("auth");
		localStorage.clear("node");
		localStorage.clear("refresh");
		window.location.reload(true);
		
		//fdp.synced = false;
		//fdp.emitter.emit('logout');

	},
	login: (username, password) => {
		var params = {
			auto: true,
			t: 'webNative'
		};

		if (username && password) {
			params.Email = username;
			params.Passwd = password;
		}
		else if (localStorage.refresh)
			params.Refresh = localStorage.refresh;
		else
			return;
		
		// login resolves in a promise

	
		
		return new Promise((resolve, reject) => {
			if(fdp.master){
			$.ajax({
				rejectUnauthorized: false,
				url: server.serverURL+"/accounts/ClientLogin",
				method: 'POST',
				cache:false,
				timeout: 2000,
				data:params,
				headers: {
					'Content-type': 'application/x-www-form-urlencoded'
				}				
			}).done((res,success,body) =>{
				
				// if success...
				if (res.indexOf('Auth=') != -1) {
					var creds = res.match(/Auth=[^\n]*/)[0].replace('Auth=', '').split('/');
					var refresh = res.match(/Refresh=[^\n]*/)[0].replace('Refresh=', '');

					// store it now and forever
					localStorage.node = creds[0];
					localStorage.auth = creds[1];
					localStorage.refresh = refresh;

					
					//login resolves in a promise instead of automatically starting sync process...
					// start syncing
					 fdp.versionCheck();
					// return promise
					resolve(1);
				}
				
			}).fail((res,err,body)=>{
				// does the below (along w/ an else if for 2nd branch) fix refresh???
				
				if (err == "timeout") {
					fdp.synced = false;
					fdp.login();
				}
				

				if (res.status == 403){
					// no response -> can't connect to FDP server -> display error

					resolve(res.status);
				}
				else{
					// last ditch catch-all -> not success and not 403 bad auth...
					resolve(0);
				}

				
			});
		}
		else{
			resolve(1);
		}

		});
	




		
		
	},
	versionCheck: () => {
		var url;
		// first time vs every other time
		if (!fdp.synced)
			url = `${server.serverURL}/v1/versions?t=web&${fdp.feeds.join('=&')}=`;
		else
			url = `${server.serverURL}/v1/versionscache?t=web`;

		fdp.xhr = $.ajax({
			rejectUnauthorized: false,
			url: url,
			method: 'POST',
			cache:false,
			timeout: 9000,
			headers: {
				'Content-type': 'application/x-www-form-urlencoded',
				'Authorization': 'auth=' + localStorage.auth,
				'node': localStorage.node
			}
		}).done((res,success,body)=>{
			var result = {};
			if (!success) {
				// no connection
				result.status = 404;
				// restart sync process..
				fdp.syncStatus(404);
			}
			else if (body.status == 200) {
				var updates = [];
				var params = res.split(";");
				
				// grab server timestamp
				if (sessionStorage.timeShift === undefined) {
					var date = new Date().getTime();
					
					// client time is ahead
					if (date > params[0])
						sessionStorage.timeShift = (date - params[0]);
					else if (params[0] > date)
						sessionStorage.timeShift = (params[0] - date)*-1;
					else
						sessionStorage.timeShift = 0;
				}
				
				// compile list of this.feeds to sync				
				for (let i = 2, len = params.length-1; i < len; i++)
					updates.push(params[i]);
				
				result.updates = updates;

				if (updates.length > 0){
					result.status = body.status;
					// ***send to sync***

					fdp.syncRequest(updates);
				}
				else{
					result.status = body.status
					// fail - restart sync...
					fdp.syncStatus(body.status);
				}
			}
			else{
				result.status = body.status;
				// fail - restart sync...
				
				
				fdp.syncStatus(body.status);
			}

		}).fail((res,err,body)=>{
			var result = {};
			if(res){
				// result.status = res.status;
				// fail - restart sync...
				fdp.syncStatus(res.status);
			}

		});
	},
	syncRequest: (updates) => {
		fdp.xhr = $.ajax({
			rejectUnauthorized: false,
			url: `${server.serverURL}/v1/sync?t=web&${updates.join('=&')}=`,
			method: 'POST',
			cache:false,
			timeout: 9000,
			headers: {
				'Content-type': 'application/x-www-form-urlencoded',
				'Authorization': 'auth=' + localStorage.auth,
				'node': localStorage.node
			}
		}).done((res,success,body)=>{
			var result = {};
			if (!success) {
				// no connection
				result.status = 404;
				fdp.syncStatus(404);
			}
			else if (body.status == 200) {
				// first time success
				if (!fdp.synced) {
					fdp.synced = true;
					fdp.emitter.emit('data_sync_update', {});

					//this.emit('success', {});
				}
				// format sync data
				var data = JSON.parse(res
					.replace(/\\'/g, "'")
					.replace(/([\u0000-\u001F])/g, (match) => {
						let c = match.charCodeAt();
						return "\\u00" + Math.floor(c/16).toString(16) + (c%16).toString(16);
					})
				);

				for (let i in data) {
					var feed = data[i];
					var merged = [];
					for (let key in feed) {
						if (feed[key].items && feed[key].items.length > 0) {
							for (let i = 0, len = feed[key].items.length; i < len; i++){
								feed[key].items[i].xpid = key + '_' + feed[key].items[i].xef001id;
							}
						}
						merged = merged.concat(feed[key].items);
					}
					data[i] = merged;
				}
			}
			// emit synced data...
			

			fdp.emitter.emit('data_sync_update', data);
	
			// then resync...
			fdp.syncStatus();


		}).fail((res,err,body) => {
			if (res) {
				// resync...
				fdp.syncStatus(res.status);
			}
		})
	},
	syncStatus: (status = 200) => {
		fdp.status = status;
		switch(status) {
			// auth error
			case 401:
			case 402:
			case 403:				
				// reset creds
				localStorage.auth = null;
				localStorage.node = null;
				// call client login for new auth token
				if(localStorage.refresh == null || localStorage.refresh == undefined){
					fdp.logout();
				}
				else{		
				fdp.synced = false;
				fdp.login();
				}
			
				break;
			// network failure
			case 404:
			case 500:
			case 503:
				//this.emit('failure', {});
				
			// timeout or success
			case 0:
			case 200:
				setTimeout(() => {
					fdp.versionCheck();
				}, 2000);
				
			
				break;
		}
	},
	
	// call fdp api
	postFeed(feed, action, data) {

		var params = {
			t: 'web',
			action: action
		};
		
		// add optional paramters
		if (data) {
			for (let key in data) {
				params[`a.${key}`] = data[key];
			}
		}
		// console.log('pf params - ', params);
		// checking the fdp call before it's made...

		return new Promise((resolve, reject) => {
		$.ajax({
			rejectUnauthorized: false,
			url: `${server.serverURL}/v1/${feed}`,
			method: 'POST',
			cache:false,
			timeout: 9000,
			headers: {
				'Content-type': 'application/x-www-form-urlencoded',
				'Authorization': 'auth=' + localStorage.auth,
				'node': localStorage.node
			},
			data: params
		}).done((res,success,body) => {
			 console.log('postFeed done - ', res, success, body);
			 	setTimeout(()=>{resolve(1)},1500);
			 
			 
		}).fail((res,err,body) => {
			// fail placeholder
			 console.log('postfeed fail - ', res, err, body);
		});
	});
		
	}
};

export default fdp;

function WindowController (newId) {
	

    if(!fdp.master && newId){
    	this.id = Math.random();
    	
    }
    else{
    	this.id = new Date().getTime();
	}

    this.isMaster = false;
	

    this.others = {};

    window.addEventListener( 'storage', this, false );
    window.addEventListener( 'unload', this, false );

    this.broadcast( 'hello' );

    var that = this;
    var check = function check () {
        that.check();
        that._checkTimeout = setTimeout( check, 1000 );
    };
    var ping = function ping () {
        that.sendPing();
        that._pingTimeout = setTimeout( ping, 1700 );
    };
    this._checkTimeout = setTimeout( check, 50 );
    this._pingTimeout = setTimeout( ping, 1700 );
}

WindowController.prototype.destroy = function () {
    clearTimeout( this._pingTimeout );
    clearTimeout( this._checkTimeout );

    window.removeEventListener( 'storage', this, false );
    window.removeEventListener( 'unload', this, false );

    this.broadcast( 'bye' );
};

WindowController.prototype.handleEvent = function ( event ) {
    if ( event.type === 'unload' ) {
        this.destroy();
    } else if ( event.key === 'broadcast' ) {
        try {
            var data = JSON.parse( event.newValue );
            if ( data.id !== this.id ) {
                this[ data.type ]( data );
            }
        } catch ( error ) {}
    }
};

WindowController.prototype.sendPing = function () {
    this.broadcast( 'ping' );
};

WindowController.prototype.hello = function ( event ) {
    this.ping( event );
    if ( event.id < this.id ) {
        this.check();
    } else {
        this.sendPing();
    }
};

WindowController.prototype.ping = function ( event ) {
    this.others[ event.id ] = +new Date();
};

WindowController.prototype.bye = function ( event ) {
    delete this.others[ event.id ];
    this.check();
};

WindowController.prototype.check = function ( event ) {
    if(!fdp.master){
	 fdp.checkMaster();
	}
    var now = +new Date(),
        takeMaster = true,
        id;
    for ( id in this.others ) {
        if ( this.others[ id ] + 23000 < now ) {
            delete this.others[ id ];
        } else if ( id < this.id ) {
            takeMaster = false;
        }
    }
	

    if ( this.isMaster !== takeMaster ) {
        this.isMaster = takeMaster;
        this.masterDidChange();
    }

 
};

WindowController.prototype.masterDidChange = function () {
	console.log("IS Master",this.isMaster);
	fdp.isMaster(this.isMaster);
};

WindowController.prototype.broadcast = function ( type, data ) {
    var event = {
        id: this.id,
        type: type
    };
    for ( var x in data ) {
        event[x] = data[x];
    }
    try {
        localStorage.setItem( 'broadcast', JSON.stringify( event ) );
    } catch ( error ) {}
};

	 obj = new WindowController();
