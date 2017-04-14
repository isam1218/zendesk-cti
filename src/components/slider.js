import "babel-polyfill";
import "es6-promise/auto";
import React, { Component } from 'react';
// custom input to facilitate adding color to ranges //

export default class Slider extends Component {	
	// data requirements
	// static propTypes = {
	// 	value: React.PropTypes.string.isRequired,
	// 	setting: React.PropTypes.string,
	// 	callback: React.PropTypes.func
	// }
	
	constructor(props) {
		super(props);
		
		// use state for position since it can also be changed internally
		this.state = {
			value: props.value
		};
	}
	
	componentWillReceiveProps(props) {
		// override from server
		if (this.props.value != props.value) {
			this.setState({
				value: props.value
			});
		}
	}
	
	_updatePosition(e) {
		this.setState({
			value: e.target.value
		});
	}
	
	_handleChange(e) {
		// optional in case some sliders don't need to call parent
		if (this.props.setting && this.props.callback)
			this.props.callback(this.props.setting, e.target.value);
	}
	
	render() {
		// format new css changes
		var percent = this.state.value*100;
		
		var styles = {
			background: `-webkit-linear-gradient(left, #00ad33 0%, #00ad33 ${percent}%, #9fffbb ${percent}%)`
		};
		
		return(
			<input 
				className="slider"
				type="range"
				value={this.state.value}
				defaultValue="0.5"
				min="0" 
				max="1" 
				step=".01"
				style={styles}
				onInput={(e) => this._updatePosition(e)} 
				onChange={(e) => this._handleChange(e)}
			/>
		);
	}
}