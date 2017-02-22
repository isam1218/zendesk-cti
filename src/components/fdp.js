import $ from 'jquery';
import {EventEmitter} from 'fbemitter';
import config from '../config.js';
import server from '../properties.js';

const emitter = new EventEmitter();

const fdp =  {
	emitter: emitter,
	feeds: ['me', 'settings', 'locations', 'location_status', 'mycalls', 'mycalldetails', 'fdpImage', 'quickinbox','calllog','queue_members_status','queues','queue_members','queuelogoutreasons'],
	synced: false,
	refresh: null,
	status: 0,
	xhr:'',
	init: () => {
		fdp.login();
	},
	logout: ()=>{
		setTimeout(()=>{fdp.xhr.abort()},3000);
		localStorage.clear("auth");
		localStorage.clear("node");
		localStorage.clear("refresh");
		fdp.synced = false;
		
	
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