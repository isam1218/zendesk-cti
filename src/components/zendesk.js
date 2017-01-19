import $ from 'jquery';
import config from '../config.js';

// http://stackoverflow.com/questions/5507234/how-to-use-basic-auth-with-jquery-and-ajax
// xhr.setRequestHeader("Authorization", "Bearer " + `${config.accessToken}`);
const zendesk = {

	defaultRequestConfig(url, method) {
		// url argument is everything that comes AFTER '/api/v2/'
		return {
			"async": true,
			"crossDomain": true,
			"url": `https://fonality1406577563.zendesk.com/api/v2/${url}`,
			"method": method,
			"beforeSend": function(xhr) {
				xhr.setRequestHeader("Authorization", "Bearer " + `${config.accessToken}`);
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
		// https://developer.zendesk.com/rest_api/docs/core/users#show-the-currently-authenticated-user
		var url = 'users/me.json';
		var settings = this.defaultRequestConfig(url, "GET");
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
		// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#open-a-users-profile-in-an-agents-browser
		console.log('in profilePop!, agent + user  -> -', agent, user);
		var uri = `channels/voice/agents/${agent}/users/${user}/display.json`;
		var url = encodeURI(uri);
		var settings = this.defaultRequestConfig(url, "POST");
		settings.contentType = "text/plain";
		settings.dataType = "text";
		return new Promise((resolve, reject) => {
			$.ajax(settings).done((res) => {
				console.log('END USER PROFILE POP SUCCEESS! res -', res);
				resolve(res);
			}).fail((res,err,body) => {
				console.log('zd: fail - res -', res);
				console.log('err - ', err);
				console.log('body - ', body);
				resolve(res,err,body);
			});		
		})
	},

	grabCallId(phoneNumber) {
		// https://developer.zendesk.com/rest_api/docs/core/search#search
		var uri = `users/search.json?query=*${phoneNumber}`;
		var url = encodeURI(uri);
		var settings = this.defaultRequestConfig(url, "GET");
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
		// https://developer.zendesk.com/rest_api/docs/core/users#create-user
    var url = 'users.json';
		var settings = this.defaultRequestConfig(url, "POST");
		settings.contentType = "application/json";
		settings.data = JSON.stringify(userData);
		return new Promise((resolve, reject) => {
			$.ajax(settings).done((res) => {
				console.log('res USER CREATED successfully in zd module - ', res);
				resolve(res);
			}).fail((res,err,body) => {
				console.log('fail - ', res,err,body);
			})    
		})
  },

	createNewTicket(endUser, via_id, meAgent) {
		//https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#creating-tickets
		var url = 'channels/voice/tickets.json';
		// var url = 'tickets.json';
		var settings = this.defaultRequestConfig(url, "POST");
		// requester == user asking for support (the end customer/user in our case)
		// submitter == user creating the ticket (the agent in our case)
		var data = {
			"display_to_agent": meAgent.id,
			"ticket": {
				"via_id": via_id,
				"created_at": endUser.created_at,
				"requester_id": endUser.id,
				"submitter_id": meAgent.id,
				"description": `New ticket for new end user created. Origin phone number is: ${endUser.phone}`,
				"requester": {
					"name": endUser.name,
					"phone": endUser.phone
				}
			}
		};
		settings.contentType = "application/json";
		settings.data = JSON.stringify(data);
		return new Promise((resolve, reject) => {
			$.ajax(settings).done(res => {
				console.log('ticket created in zd module - ', res);
				resolve(res);
			}).fail((res,err,body) => {
				console.log('fail - ', res,err,body);
				resolve(res);
			})
		})

	},

	openCreatedTicket(myAgentId, ticketId) {
		// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#open-a-ticket-in-an-agents-browser	
		var uri = `channels/voice/agents/${myAgentId}/tickets/${ticketId}/display.json`;
		var url = encodeURI(uri);
		var settings = this.defaultRequestConfig(url, "POST");
		settings.contentType = "text/plain";
		settings.dataType = "text";
		return new Promise((resolve, reject) => {
			$.ajax(settings).done((res) => {
				console.log('NEW TICKET POP SUCCEESS! res -', res);
				resolve(res);
			}).fail((res,err,body) => {
				console.log('zd: new ticket pop fail - res -', res);
				console.log('err - ', err);
				console.log('body - ', body);
				resolve(res,err,body);
			});	

		});
	}

}

export default zendesk;