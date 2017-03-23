import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import $ from 'jquery';
import {EventEmitter} from 'fbemitter';
import config from '../config.js';
import server from '../properties.js';

function WindowController () {
    var now = Date.now(),
        ping = 0;
    try {
        ping = +localStorage.getItem( 'ping' ) || 0;
    } catch ( error ) {}
    if ( now - ping > 45000 ) {
        this.becomeMaster();
    } else {
        this.loseMaster();
    }
    window.addEventListener( 'storage', this, false );
    window.addEventListener( 'unload', this, false );
}

WindowController.prototype.isMaster = false;
WindowController.prototype.destroy = function () {
    if ( this.isMaster ) {
        try {
            localStorage.setItem( 'ping', 0 );
        } catch ( error ) {}
    }
    window.removeEventListener( 'storage', this, false );
    window.removeEventListener( 'unload', this, false );
};

WindowController.prototype.handleEvent = function ( event ) {
    if ( event.type === 'unload' ) {
        this.destroy();
    } else {
        var type = event.key,
            ping = 0,
            data;
        if ( type === 'ping' ) {
            try {
                ping = +localStorage.getItem( 'ping' ) || 0;
            } catch ( error ) {}
            if ( ping ) {
                this.loseMaster();
            } else {
                // We add a random delay to try avoid the race condition in 
                // Chrome, which doesn't take out a mutex on local storage. It's
                // imperfect, but will eventually work out.
                clearTimeout( this._ping );
                this._ping = setTimeout(
                    this.becomeMaster.bind( this ),
                    ~~( Math.random() * 1000 )
                );
            }
        } else if ( type === 'broadcast' ) {
            try {
                data = JSON.parse(
                    localStorage.getItem( 'broadcast' )
                );
                this[ data.type ]( data.event );
            } catch ( error ) {}
        }
    }
};

WindowController.prototype.becomeMaster = function () {
    try {
        localStorage.setItem( 'ping', Date.now() );
    } catch ( error ) {}

    clearTimeout( this._ping );
    this._ping = setTimeout( this.becomeMaster.bind( this ),
        20000 + ~~( Math.random() * 10000 ) );

    var wasMaster = this.isMaster;
    this.isMaster = true;
    if ( !wasMaster ) {
        this.masterDidChange();
    }
};

WindowController.prototype.loseMaster = function () {
    clearTimeout( this._ping );
    this._ping = setTimeout( this.becomeMaster.bind( this ),
        35000 + ~~( Math.random() * 20000 ) );

    var wasMaster = this.isMaster;
    this.isMaster = false;
    if ( wasMaster ) {
        this.masterDidChange();
    }
};

WindowController.prototype.masterDidChange = function () {
	console.log("MASTER PROTO",this.isMaster);
	return this.isMaster;
};

WindowController.prototype.broadcast = function ( type, event ) {
    try {
        localStorage.setItem( 'broadcast',
            JSON.stringify({
                type: type,
                event: event
            })
        );
    } catch ( error ) {}
};

var obj = new WindowController();

var master = obj.masterDidChange();

console.log("MASTER",master);

const emitter = new EventEmitter();

const fdp =  {
	emitter: emitter,
	feeds: ['me', 'settings', 'locations', 'location_status', 'mycalls', 'mycalldetails', 'fdpImage', 'quickinbox','calllog','queue_members_status','queues','queue_members','queuelogoutreasons'],
	synced: false,
	refresh: null,
	status: 0,
	isMaster:master,
	xhr:'',
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
		fdp.synced = false;
		fdp.emitter.emit('logout');
	
	},
	login: (username, password) => {
		var params = {
			auto: true,
			t: 'webNative'
		};

console.log("FDP MASTER",fdp.isMaster);
		
		if (username && password) {
			params.Email = username;
			params.Passwd = password;
		}
		else if (localStorage.refresh)
			params.Refresh = localStorage.refresh;
		else
			return;
		
		// login resolves in a promise
		if(fdp.isMaster){
		return new Promise((resolve, reject) => {
		$.ajax({
				rejectUnauthorized: false,
				url: server.serverURL+"/accounts/ClientLogin",
				method: 'POST',
				timeout: 90000,
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
				/*
				if (err == "timeout") {
					console.log('timeout! refresh??? - ', err);
					fdp.login();
				}
				*/

				if (res.status == 403){
					// no response -> can't connect to FDP server -> display error

					resolve(res.status);
				}
				else{
					// last ditch catch-all -> not success and not 403 bad auth...
					resolve(0);
				}

				fdp.logout();
			});
		});
	}
	else{
		ReactDOM.render(<App settings={JSON.parse(localStorage.settings)} avatars={JSON.parse(localStorage.avatars)} mycalls={JSON.parse(localStorage.mycalls)} locations={JSON.parse(localStorage.locations)} calllog={JSON.parse(localStorage.calllog)} queue_members={JSON.parse(localStorage.queue_members)} queue_members_status={JSON.parse(localStorage.queue_members_status)} queues={JSON.parse(localStorage.queues)} queuelogoutreasons={JSON.parse(localStorage.queuelogoutreasons)} deletedCalls={JSON.parse(localStorage.deletedCalls)} />, document.querySelector('.container'));
		//fdp.emitter.emit('data_sync_update');
	}


		
		
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
			timeout: 90000,
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
			timeout: 90000,
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
			console.log("DATA",data);
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
				fdp.login();
			
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
				}, 1500);
				
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
		$.ajax({
			rejectUnauthorized: false,
			url: `${server.serverURL}/v1/${feed}`,
			method: 'POST',
			timeout: 90000,
			headers: {
				'Content-type': 'application/x-www-form-urlencoded',
				'Authorization': 'auth=' + localStorage.auth,
				'node': localStorage.node
			},
			data: params
		}).done((res,success,body) => {
			 console.log('postFeed done - ', res, success, body);
		}).fail((res,err,body) => {
			// fail placeholder
			 console.log('postfeed fail - ', res, err, body);
		});
	}
};





export default fdp;