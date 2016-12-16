'use strict';

// all feeds native app needs to sync
var feeds = ['me', 'settings', 'locations', 'location_status', 'mycalls', 'mycalldetails', 'fdpImage', 'quickinbox'];

class FDP extends React.Component {
	constructor() {
		super();
		
		this.synced = false;
		this.refresh = null;
		this.status = 0;
	}
	
	init() {			
		
		// start syncin'
		this.versionCheck();
	}
	
	// get credentials
	login(username, password) {
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
		
		return new Promise((resolve, reject) => {
			$.ajax({
				rejectUnauthorized: false,
				url: "https://dev4.fon9.com:8081/accounts/ClientLogin",
				method: 'POST',
				timeout: 90000,
				data:params,
				headers: {
					'Content-type': 'application/x-www-form-urlencoded'
				}				
			}).done((res,success,body) =>{
				
				console.log("SUCCESS",res);
				// if success...
				if (res.indexOf('Auth=') != -1) {
					var creds = res.match(/Auth=[^\n]*/)[0].replace('Auth=', '').split('/');
					this.refresh = res.match(/Refresh=[^\n]*/)[0].replace('Refresh=', '');

					// store it now and forever
					localStorage.node = creds[0];
					localStorage.auth = creds[1];
					localStorage.refresh = this.refresh;
					
					
					// start syncing
					this.versionCheck();
					
					// return promise
					resolve(1);
				}
				
			}).fail((res,err,body)=>{

				if (res.status == 403){
					// no response -> can't connect to FDP server -> display error
					resolve(res.status);
				}
				else{
					// last ditch catch-all -> not success and not 403 bad auth...
					resolve(0);
				}
			});
		});
	}
	
	// check for feed changes
	versionCheck() {
		var url;
		
		// first time vs every other time
		if (!this.synced)
			url = `https://dev4.fon9.com:8081/v1/versions?t=web&${feeds.join('=&')}=`;
		else
			url = `https://dev4.fon9.com:8081/v1/versionscache?t=web`;


		$.ajax({
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
			if (!success) {
				// no connection
				this.syncStatus(404);
			}
			else if (body.status == 200) {
				var updates = [];
				var params = res.split(";");
				
				// grab server timestamp
				if (localStorage.timeShift === undefined) {
					var date = new Date().getTime();
					
					// client time is ahead
					if (date > params[0])
						localStorage.timeShift = (date - params[0]);
					else if (params[0] > date)
						localStorage.timeShift = (params[0] - date)*-1;
					else
						localStorage.timeShift = 0;
				}
				
				// compile list of feeds to sync				
				for (let i = 2, len = params.length-1; i < len; i++)
					updates.push(params[i]);
				
				if (updates.length > 0)
					this.syncRequest(updates);
				else
					this.syncStatus(body.status);
			}
			else
				this.syncStatus(body.status);

		}).fail((res,err,body)=>{
							ReactDOM.render(React.createElement(LoginWindow, null), document.getElementById('body'));

			if(res){
				this.syncStatus(res.status);
			}
			});
	}
	
	// retrieve feed updates
	syncRequest(updates) {
		$.ajax({
			rejectUnauthorized: false,
			url: `https://dev4.fon9.com:8081/v1/sync?t=web&${updates.join('=&')}=`,
			method: 'POST',
			timeout: 90000,
			headers: {
				'Content-type': 'application/x-www-form-urlencoded',
				'Authorization': 'auth=' + localStorage.auth,
				'node': localStorage.node
			}
		}).done((res,success,body)=>{

			if (!success) {
				// no connection
				this.syncStatus(404);
			}
			else if (body.status == 200) {
				// first time success
				if (!this.synced) {
					this.synced = true;	
					
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
					
					// merge item arrays under each feed
					for (let key in feed) {
						if (feed[key].items && feed[key].items.length > 0) {
							// create xpid for each record
							for (let i = 0, len = feed[key].items.length; i < len; i++)
								feed[key].items[i].xpid = key + '_' + feed[key].items[i].xef001id;
								
							merged = merged.concat(feed[key].items);
						}
					}
					
					data[i] = merged;
				}
				
				// send back to main script
				//this.emit('sync', data);
				ReactDOM.render(React.createElement(AppWindow, data), document.getElementById('body'));
				this.syncStatus(body.status);
			}
			
		}).fail((res,err,body)=>{
			if(res){
				this.syncStatus(res.status);
			}
			});
	}
	
	// check xmlhttp status before resuming sync
	syncStatus(status) {
		this.status = status;
		switch(status) {
			// auth error
			case 401:
			case 402:
			case 403:				
				// reset creds
				localStorage.auth = null;
				localStorage.node = null;
				
				// call client login for new auth token
				this.login();
			
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
					this.versionCheck();
				}, 1500);
				
				break;
		}
	}
	
	// pull feed directly from server
	getFeed(feed) {
		return new Promise((resolve, reject) => {
			$.ajax({
				rejectUnauthorized: false,
				url: `https://dev4.fon9.com:8081/v1/${feed}`,
				method: 'GET',
				headers: {
					'Content-type': 'application/x-www-form-urlencoded',
					'Authorization': 'auth=' + localStorage.auth,
					'node': localStorage.node
				}
			}).done((err, res, body) => {
				var data = JSON.parse(body
					.replace(/\\'/g, "'")
					.replace(/([\u0000-\u001F])/g, (match) => {
						let c = match.charCodeAt();
						return "\\u00" + Math.floor(c/16).toString(16) + (c%16).toString(16);
					})
				);
				
				var merged = [];
			
				// merge item arrays
				for (let key in data) {
					if (data[key].items && data[key].items.length > 0) {
						// create xpid for each record
						for (let i = 0, len = data[key].items.length; i < len; i++)
							data[key].items[i].xpid = key + '_' + data[key].items[i].xef001id;
							
						merged = merged.concat(data[key].items);
					}
				}
				
				// send promise back
				resolve(merged);
			});
		});
	}
	
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
		
		$.ajax({
			rejectUnauthorized: false,
			url: `https://dev4.fon9.com:8081/v1/${feed}`,
			method: 'POST',
			headers: {
				'Content-type': 'application/x-www-form-urlencoded',
				'Authorization': 'auth=' + localStorage.auth,
				'node': localStorage.node
			},
			form: params
		}).done((err, res, body) => {
			// this placeholder is required to suppress network errors
		});
	}
};