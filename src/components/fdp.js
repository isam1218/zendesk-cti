import $ from 'jquery';

const fdp =  {
	feeds: ['me', 'settings', 'locations', 'location_status', 'mycalls', 'mycalldetails', 'fdpImage', 'quickinbox'],
	synced: false,
	refresh: null,
	status: 0,
	init: () => {
		this.version.check();
	},
	login: (username, password) => {
		console.log('fdp: IN fdp LOGIN!!!!')
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
				
				// if success...
				if (res.indexOf('Auth=') != -1) {
					var creds = res.match(/Auth=[^\n]*/)[0].replace('Auth=', '').split('/');
					var refresh = res.match(/Refresh=[^\n]*/)[0].replace('Refresh=', '');

					// store it now and forever
					localStorage.node = creds[0];
					localStorage.auth = creds[1];
					localStorage.refresh = refresh;
					
					
					console.log("SUCCESS! about to versionCheck... ", creds);

					// start syncing
					// fdp.versionCheck()

					// this.versionCheck.bind(fdp);
					
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
	},
	versionCheck: () => {

		return new Promise((resolve, reject) => {
			console.log('fdp: in VERSION CHECK! - ');
			var url;
			
			// first time vs every other time
			if (!fdp.synced)
				url = `https://dev4.fon9.com:8081/v1/versions?t=web&${fdp.feeds.join('=&')}=`;
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
					fdp.syncStatus(404);
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
					
					// compile list of this.feeds to sync				
					for (let i = 2, len = params.length-1; i < len; i++)
						updates.push(params[i]);
					
					if (updates.length > 0){
						// fdp.syncRequest(updates);
						fdp.syncRequest(updates).then((status, err) => {
							console.log('fdp in version check, syncrequest promise return - should return status === data ', status);
							resolve(status);
						})
					}
					else
						fdp.syncStatus(body.status);
				}
				else
					fdp.syncStatus(body.status);

			}).fail((res,err,body)=>{
								// ReactDOM.render(React.createElement(LoginWindow, null), document.getElementById('body'));

				if(res){
					fdp.syncStatus(res.status);
				}
				});

		})


	},
	syncRequest: (updates) => {
		console.log('fdp: SYNC REQUEST CALLED ! - ', updates);

		return new Promise((resolve, reject) => {
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
					fdp.syncStatus(404);
				}
				else if (body.status == 200) {
					// first time success
					if (!fdp.synced) {
						fdp.synced = true;	
						
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

				console.log('abotu to send data to react component! - ', data);
				resolve(data);
				fdp.syncStatus(body.status);

			}).fail((res,err,body) => {
				if (res) {
					resolve(0);
					fdp.syncStatus(res.status);
				}
			})

		})

					// for (let i in data) {
					// 	var feed = data[i];
					// 	var merged = [];
						
					// 	// merge item arrays under each feed
					// 	for (let key in feed) {
					// 		if (feed[key].items && feed[key].items.length > 0) {
					// 			// create xpid for each record
					// 			for (let i = 0, len = feed[key].items.length; i < len; i++)
					// 				feed[key].items[i].xpid = key + '_' + feed[key].items[i].xef001id;
					// 		};
					// 			merged = merged.concat(feed[key].items);
					// 		}
					// 	}
						
					// 	data[i] = merged;
					// }
					
					// send back to main script
					/**** MIGHT HAVE TO REFACTOR SYNCREQUEST to wrap ajax call in new Promise to resolve data...
						// do we wrap the final function in chain of functions (cuz login calls versionCheck calls syncRequest) into a promise (like below), or in the alternatie -> combine all into 1 func and return that as a promise????
					
					syncRequest(updates) {
						return new Promise((resolve, reject) => {
							$.ajax({
			
							}).done((res, success, body) => {
								// eventually ended up w/ 'data', RETURN AS PROMISE!!!
								resolve(data);
							}).fail((res,err,body) => {
								resolve(res.status);
								this.syncStatus(res.status);
							})
					}
						
					}
					*/

/*
					//this.emit('sync', data);
					resolve('FOO!');
					console.log('new data about to be sent to react component! - ', data);
					// need to send data back to app.js


					// ReactDOM.render(<AppWindow />, document.getElementById('body'));
					// ReactDOM.render(React.createElement(AppWindow, data), document.getElementById('body'));
					fdp.syncStatus(body.status);
				}).fail((res,err,body)=>{
					if(res){
						resolve('0');
						fdp.syncStatus(res.status);
					}
			// });
		})
		*/

	},
	syncStatus: (status) => {
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
	}
};

export default fdp;