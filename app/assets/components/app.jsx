class AppWindow extends React.Component {
	// data requirements
	static propTypes = {
		locations: React.PropTypes.object.isRequired,
		settings: React.PropTypes.object.isRequired,
		quickinbox: React.PropTypes.object.isRequired,
		avatars: React.PropTypes.object.isRequired,
		mycalls: React.PropTypes.array.isRequired
	}
	
	constructor(props) {
		super(props);
		
		// initial feed data from main.js
		this.state = props;
	}

	// THIS IS JUST AN EXAMPLE OF WHAT COULD BE RENDERED REFER TO HUDN LOGIC 
	
	render() {
		// pass feed data down the chain as props
		return(
				<div id="basic" >	
				
				
					<div>
						<span>Location:</span>
						<span className="my_location" >
							
							<i className="material-icons">expand_more</i>
						</span>
					</div>
						
					<div className="calling">
						<input 
							className="number" 
							type="text" 
							placeholder="ENTER NUMBER OR EXT." 
							value={this.state.phone} 
							onChange={(e) => this._updateValue(e, 'phone')} 
							onKeyPress={(e) => this._callNumber(e)}
							onInput={(e) => this._restrictInput(e)}
						/>
						
						
						<i  onClick={() => this._callNumber()}>call</i>
					</div>
				</div>
			);
	}
}

