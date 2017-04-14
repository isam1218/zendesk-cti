import "babel-polyfill";
import "es6-promise/auto";
import React, { Component } from 'react';
// custom span to auto-increment a timestamp //

export default class Timer extends Component {	
	// data requirements
	static propTypes = {
		start: React.PropTypes.number.isRequired
	}
	
	constructor(props) {
		super(props);
		
		// set starting position
		this.state = {
			time: new Date().getTime() - props.start
		};
	}
	
	componentDidMount() {
		// update state every second
		this._tick = setInterval(() => {
			this.setState({
				time: this.state.time+1000
			});
		}, 1000);
	}
	
	componentWillReceiveProps(props) {
		// props changed, so state should catch up
		this.setState({
			time: new Date().getTime() - props.start
		});
	}
	
	componentWillUnmount(){
		// clean up
		clearInterval(this._tick);
	}
	
	render() {	
		// format time		
		var seconds = Math.floor(this.state.time / 1000);
		var minutes = Math.floor(((seconds % 86400) % 3600) / 60);
		var hours = Math.floor((seconds % 86400) / 3600);
		var days = Math.floor(seconds / 86400);
		
		var timeString = '';
		
		if (days > 1)
			timeString = days + ' days ';
		else if (days == 1)
			timeString = '1 day ';
		
		if (hours > 0) 
			timeString += hours + ':';
		
		if (minutes > 9)
			timeString += minutes + ':';
		else if (minutes > 0)
			timeString += '0' + minutes + ':';
		else
			timeString += '00:';
		
		seconds = seconds % 60;
		
		if (seconds > 9)
			timeString += seconds;
		else if (seconds > 0)
			timeString += '0' + seconds;
		else
			timeString += '00';
	
		return(
			<span>
				{timeString}
			</span>
		);
	}
}