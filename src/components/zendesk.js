import $ from 'jquery';
import config from '../config.js';

// http://stackoverflow.com/questions/5507234/how-to-use-basic-auth-with-jquery-and-ajax
const zendesk = {
	getZendeskRequest(phoneNumber) {
    var url = `/search.json?query=role%3Aend-user%20phone%3A*${phoneNumber}`;
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": `https://fonality1406577563.zendesk.com/api/v2/${url}`,
			"method": "GET",
			"beforeSend": function(xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa(`${config.username}:${config.token}`));
			},
			"contentType": "application/json",
			"dataType": "json",
			"cors": false
		}
		$.ajax(settings).done((res) => {
			console.log('res - ', res);
			var resultsArray = res.results;
		}).fail((res,err,body) => {
			console.log('fail - ', res);
		})

	},

	grabMe() {
		var url = 'users/me.json';
		console.log('in zd grab me func! url is - ', `https://fonality1406577563.zendesk.com/api/v2/${url}`)
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": `https://fonality1406577563.zendesk.com/api/v2/${url}`,
			"method": "GET",
			"beforeSend": function(xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa(`${config.username}:${config.token}`));
			},
			"headers": {
				"Accept": "application/json"
			},
			"cache": false,
			"dataType": "json",
			"cors": true,
			"xhrFields": {
				"withCredentials": false
			}
		}
		return new Promise((resolve, reject) => {
			$.ajax(settings).success((res) => {
				console.log('success THIS IS ME IN ZD - ', res);
				resolve(res);
			})
			// .fail((err) => {
			// 	console.log('fail my agent id!! - ', err);
			// 	resolve(err);
			// })
		});
	},

	grabIncomingCallId(phoneNumber) {
		// var uri = `search.json?query=role%3Aend-user%20phone%3A*${phoneNumber}`;
    // var url = `/users/search.json?query=type%3Auser${name}`;
		// search.json?query=type%3Aticket+status%3Aopen
		var url = `users/search.json?query=*${phoneNumber}`
		// var url = encodeURI(uri);
		console.log('in grabIncomingCallId, url is - ', `https://fonality1406577563.zendesk.com/api/v2/${url}`);
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": `https://fonality1406577563.zendesk.com/api/v2/${url}`,
			"method": "GET",
			"beforeSend": function(xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa(`${config.username}:${config.token}`));
			},
			"headers": {
				"Accept": "application/json"
			},
			"cache": false,
			"dataType": "json",
			"cors": true,
			"xhrFields": {
				"withCredentials": false
			}
		}
		return new Promise((resolve, reject) => {
			$.ajax(settings).success((res) => {
				console.log('success THIS IS ME IN ZD grab incoming call - ', res);
				resolve(res);
			})
			// .fail((err) => {
			// 	console.log('fail my agent id!! - ', err);
			// 	resolve(err);
			// })
		});
		// return new Promise((resolve, reject) => {
		// 	$.ajax(settings).done((res,success,body) => {
		// 		console.log('****END USER ID res!! - ', res);
		// 		var resultsArray = res.results;
		// 		resolve(resultsArray);
		// 	}).fail((res,err,body) => {
		// 		console.log('incoming call id fail! - ', res);
		// 		resolve(res);
		// 	});
		// });
	},

	openProfile(agent, user) {
		console.log('in OPEN PROFILE!, agent + user  -> -', agent, user);
		// 'channels/voice/agents/3921212486/users/4180586926/display.json'
    // var url = 'channels/voice/agents/3921212486/users/345563995/display.json';
		// var url = 'channels/voice/agents/3921212486/users/4180586926/display.json';
		
		var uri = `channels/voice/agents/${agent}/users/${user}/display.json`;
		var url = encodeURI(uri);
		// console.log('in OPEN PROFILE!, final url -> -', `https://fonality1406577563.zendesk.com/api/v2/${url}`);
		console.log('in openprofile url is - ', url);
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
			console.log('res!!! - ', res);
			// var resultsArray = res.results;
		}).fail((res,err,body) => {
			console.log('fail - ', res, err, body);
		})    		
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
  },

	postZendeskRequest(url) {
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
			}
		}
		$.ajax(settings).done((res) => {
			console.log('res - ', res);
			var resultsArray = res.results;
		}).fail((res,err,body) => {
			console.log('fail - ', res);
		})
	},

  linkCaller(phoneNumber) {
    // this is actually searching for users based on phone#
    // var url = 'users/search.json?query=role%'
    var url = `/search.json?query=role%3Aend-user%20phone%3A*${phoneNumber}`;
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