import $ from 'jquery';
import config from '../config.js';

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