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
			"cors": false
		}
		$.ajax(settings).done((res) => {
			console.log('res - ', res);
			var resultsArray = res.results;
		}).fail((res,err,body) => {
			console.log('fail - ', res);
		})

	},

	grabMyAgentId(name) {
		// console.log('zd module arg - ', name);
		// run a search using name arg to return associated ZD agent ...
		var uri = `/users/search.json?query=type:user ${name}`;
		var url = encodeURI(uri);
    // var url = `/users/search.json?query=type%3Auser${name}`;
		// search.json?query=type%3Aticket+status%3Aopen
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": `https://fonality1406577563.zendesk.com/api/v2/${url}`,
			"method": "GET",
			"beforeSend": function(xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa(`${config.username}:${config.token}`));
			},
			"cors": false
		}
		return new Promise((resolve, reject) => {
			$.ajax(settings).done((res) => {
				console.log('AGNET ID res!! - ', res);
				var resultsArray = res.users;
				resolve(resultsArray);
			}).fail((res,err,body) => {
				console.log('AGENT ID fail! - ', res);
				resolve(res)
			});
		});

	},

	openProfile() {
    var url = 'channels/voice/agents/3921212486/users/345563995/display.json';
		console.log('in OPEN PROFILE!, url -> -', url);
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
			var resultsArray = res.results;
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