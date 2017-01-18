import $ from 'jquery';
import config from '../config.js';

// http://stackoverflow.com/questions/5507234/how-to-use-basic-auth-with-jquery-and-ajax
const zendesk = {

	defaultRequestConfig(url, method) {
		// url argument is everything that comes AFTER '/api/v2/'...
		return {
			"async": true,
			"crossDomain": true,
			"url": `https://fonality1406577563.zendesk.com/api/v2/${url}`,
			"method": method,
			"beforeSend": function(xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa(`${config.username}:${config.token}`));
			},
			"headers": {
				"Accept": "application/json"
			},
			"cache": false,
			"dataType": "json",
			"xhrFields": {
				"withCredentials": false
			},
			"contentType": "text/plain",
			"cors": true
		}
	},

	grabMyAgentObj() {
		var url = 'users/me.json';
		// GET REQUEST to url...
		var settings = this.defaultRequestConfig(url, "GET");
		console.log('&zd: grabMyAgentId: settings.url - ', settings.url);
		return new Promise((resolve, reject) => {
			$.ajax(settings).done(res => {
				console.log('&zd: success THIS IS ME IN ZD - ', res);
				resolve(res);
			}).fail((res,err,body) => {
				console.log('&fail my agent id!! - ', err);
				resolve(err);
			})
		});
	},

	profilePop(agent, user) {
		console.log('in OPEN PROFILE!, agent + user  -> -', agent, user);
		// 'channels/voice/agents/3921212486/users/4180586926/display.json'
    // var url = 'channels/voice/agents/3921212486/users/345563995/display.json';
		// var url = 'channels/voice/agents/3921212486/users/4180586926/display.json';
		
		var uri = `channels/voice/agents/${agent}/users/${user}/display.json`;
		var url = encodeURI(uri);
		var settings = this.defaultRequestConfig(url, "POST");
		settings.contentType = "application/json";
		// settings.contentType: "text/plain";
		// settings.dataType = "text";
		console.log('zd: profilePop settings -  ', settings);
		$.ajax(settings).done((res) => {
			JSON.parse(res);
			// JSON.stringify(res, null, 2, true);
			console.log('zd: profile pop res!!! - ', JSON.parse(res));
		}).fail((res,err,body) => {
			console.log('zd: fail - ', res, err, body);
		})    		
	},

	grabCallId(phoneNumber) {
		// API ENDPOINTS THAT DO NOT WORK:
		// var uri = `search.json?query=role%3Aend-user%20phone%3A*${phoneNumber}`;
		// var uri = `users/search.json?phone=*${phoneNumber}`;
		// var uri = `users/search.json?phone=*${phoneNumber}`;
		// var uri = `search.json?query=type:user "phone:${phoneNumber}"`;
		// var uri = `search.json?query=type:user"phone:${phoneNumber}"`;

		// tried hitting different search API endpoints...
		// THESE ALL PROVIDE WORKING RESPONSE, but nothing comes back in promise resolve so I cannot make 3rd request.
		var uri = `users/search.json?query=*${phoneNumber}`;
		// var uri = `users/search.json?query=${phoneNumber}`;
		// var uri = `search.json?query=${phoneNumber}`;
		// var uri = `search.json?query=type:user "${phoneNumber}"`;
		// var uri = `search.json?query=type:user"${phoneNumber}"`
		// var uri = `search.json?query=type:user phone:${phoneNumber}`;

		var url = encodeURI(uri);
		var settings = this.defaultRequestConfig(url, "GET");
		// try different settings.dataType...
		console.log('@zd: grabCallId settings - ', settings);
		return new Promise((resolve, reject) => {
			$.ajax(settings).done((res) => {
				console.log('@zd: success grabCallId - ', res);
				resolve(res);
			}).fail((res, err, body) => {
				console.log('@zd: fail grabCallId - ', res);
			})
		});
	},

  createUser(userData) {
    var url = 'users.json';
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": `https://fonality1406577563.zendesk.com/api/v2/${url}`,
			"method": "POST",
			"beforeSend": function(xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa(`${config.username}:${config.token}`));
			},
			"headers": {
				"Content-Type": "application/json"
			},
			"cors": false
		}
		$.ajax(settings).done((res) => {
			console.log('res - ', res);
			var resultsArray = res.results;
		}).fail((res,err,body) => {
			console.log('fail - ', res);
		})    
  }

}

export default zendesk;