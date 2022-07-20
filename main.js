document.addEventListener("DOMContentLoaded", () => {
	const gamepad_boxes = document.getElementsByClassName("box");
	const start_button = document.getElementById("button-start");
	const reset_button = document.getElementById("button-reset");
	const circle_timer_display = document.getElementById("circle-timer").getElementsByClassName("timer")[0];
	const cross_timer_display = document.getElementById("cross-timer").getElementsByClassName("timer")[0];
	const current_player_display = document.getElementsByClassName("current-player")[0];
	const gamepad_display = document.getElementsByClassName("gamepad")[0];

	const circle_timer_text = document.createTextNode("60.0")
	const cross_timer_text = document.createTextNode("60.0")
	circle_timer_display.appendChild( circle_timer_text )
	cross_timer_display.appendChild( cross_timer_text )

	let circle_timer = undefined;
	let cross_timer = undefined
	let circle_timer_current = +circle_timer_text.nodeValue;
	let cross_timer_current = +circle_timer_text.nodeValue;
	let circle_timer_progress = 0;
	let cross_timer_progress = 0;
	let circle_timer_pause =  false;
	let cross_timer_pause = false;
	let ticker = undefined;

	let size = 3;

	let virtual_gamepad = new Array( size ).fill( null ).map( () => new Array( size ).fill( undefined ) )

	let now_player = "O";
	let playing = false;

	let iterator = {
		from: 0,
		to: size - 1,

		[Symbol.iterator]() {
			this.current = this.from;
			return this;
		},

		next() {
			if ( this.current <= this.to ) {
				return {
					done: false,
					value: this.current++
				}
			}
			else {
				return {
					done: true
				}
			}
		}
	}

	let pad_iterator = {
		from: 0,
		to: Math.pow( size, 2 ) - 1,

		[Symbol.iterator]() {
			this.current = this.from;
			return this;
		},

		next() {
			if ( this.current <= this.to ) {
				return {
					done: false,
					value: this.current++
				}
			}
			else {
				return {
					done: true
				}
			}
		}
	}

	const isBlank = ( x, y ) => {
		// console.log( virtual_gamepad )
		return !virtual_gamepad[ x ][ y ]
		// return !virtual_gamepad.at( x ).at( y );
	}

	const isBoardFull = () => {
		let flag = true
		virtual_gamepad.forEach( row => row.forEach(
			element => {
				if ( !element ) {
					flag = false
				}
			}
		))
		return flag;
	}

	const set = ( x, y ) => {
		if ( !isBlank( x, y ) ) {
			return false;
		}
		virtual_gamepad[ x ][ y ] = now_player;
		return true;
	}
	
	const check_winner = ( x, y, player ) => {
		let same_count = {
			horizontal: 0,
			vertical: 0,
			slash: 0,
			backslash: 0
		};

		let flag = {
			horizontal: true,
			vertical: true,
			slash: false,
			backslash: false
		}
		
		if ( x === y ) {
			flag.backslash = true;
		}

		if ( x + y == size - 1 ) {
			flag.slash = true;
		}

		let line_count = 0

		for ( let index of iterator ) {
			if ( flag.horizontal ) {
				if ( virtual_gamepad.at( x ).at( index ) == player ) {
					++same_count.horizontal;
					if ( index == size - 1 && same_count.horizontal < size ) {
						same_count.horizontal = 0;
					}
				}
				else {
					if ( same_count.horizontal >= 1 ) {
						same_count.horizontal = 0;
						flag.horizontal = false
					}
				}
			}

			if ( flag.vertical ) {
				if ( virtual_gamepad[ index ][ y ] == player ) {
					++same_count.vertical;
					if ( index == size - 1 && same_count.vertical < size ) {
						same_count.vertical = 0;
					}
				}
				else {
					if ( same_count.vertical >= 1 ) {
						same_count.vertical = 0;
						flag.vertical = false
					}
				}
			}

			if ( flag.backslash ) {
				if ( virtual_gamepad[ index ][ index ] == player ) {
					++same_count.backslash;
					if ( index == size - 1 && same_count.backslash < size ) {
						same_count.backslash = 0;
					}
				}
				else {
					if ( same_count.backslash >= 1 ) {
						same_count.backslash = 0;
						flag.backslash = false
					}
				}
			}

			if ( flag.slash ) {
				if ( virtual_gamepad[ index ][ size - 1 - index ] == player ) {
					++same_count.slash;
					if ( index == size - 1 && same_count.slash < size ) {
						same_count.slash = 0;
					}
				}
				else {
					if ( same_count.slash >= 1 ) {
						same_count.slash = 0;
						flag.slash = false
					}
				}
			}
		}
		
		Object.values( same_count ).forEach( count => {
			if ( count >= 3 ) {
				++line_count;
			}
		})
		
		if ( line_count >= 1 ) {
			change_play_status( false );
			alert(`贏家是${ player }`);
		}
		else if ( isBoardFull() ) {
			change_play_status( false );
			alert("平手");
		}
	}


	const reset_game = () => {
		for ( let value of pad_iterator ) {
			virtual_gamepad[ Math.trunc( value / size ) ][ value % size ] = undefined;
		}

		for ( let box of gamepad_boxes ) {
			box.dataset.player = ""
		}

		// clearInterval( circle_timer );
		// clearInterval( cross_timer );
		circle_timer_display.textContent = "60.0";
		cross_timer_display.textContent = "60.0";
		current_player_display.textContent = "";
		start_button.disabled = false;
		reset_button.disabled = true;
	}
	
	const change_play_status = to => {
		if ( to ) {
			playing = true;
			window.requestAnimationFrame( set_timer )
			current_player_display.textContent = "O";
			now_player = "O";
			gamepad_display.style.cursor = "pointer"
			start_button.disabled = true;
			reset_button.disabled = false;
			pause_timer("X");
		}
		else {
			playing = false;
			gamepad_display.style.cursor = "default"
			circle_timer_pause = true;
			cross_timer_pause = true;
		}
	}

	const force_win = player => {
		if ( player == "O" ) {
			cross_timer_display.textContent = "0.0";
		}
		else {
			circle_timer_display.textContent = "0.0";
		}
		change_play_status( false );
		alert(`贏家是${ player }`);
	}

	const set_timer = () => {
		if ( !ticker ) {
			ticker = Date.now()
		}
		if ( !circle_timer_pause ) {
			circle_timer_progress +=  Date.now() - ticker;
			if ( circle_timer_progress >= 100 ) {
				circle_timer_current = Math.round(( circle_timer_current - 0.1 ) * 100 ) / 100;
				if ( circle_timer_current % 1 == 0 ) {
					circle_timer_current = circle_timer_current + ".0"
				}
				
				circle_timer_text.nodeValue = circle_timer_current
				circle_timer_progress = 0
			}
		}
		if ( !cross_timer_pause ) {
			cross_timer_progress += Date.now() - ticker;
			if ( cross_timer_progress >= 100 ) {
				cross_timer_current = Math.round(( cross_timer_current - 0.1 ) * 100 ) / 100;
				if ( cross_timer_current % 1 == 0 ) {
					cross_timer_current = cross_timer_current + ".0"
				}
				
				cross_timer_text.nodeValue = cross_timer_current
				cross_timer_progress = 0
			}
		}
		ticker = Date.now()

		window.requestAnimationFrame( set_timer )
	}

	const clear_timer = () => {
		
	}

	const pause_timer = player => {
		if ( player == "O" ) {
			circle_timer_pause = true;
			cross_timer_pause = false;
		}
		else {
			circle_timer_pause = false;
			cross_timer_pause = true;
		}
	}

	start_button.addEventListener( "click", () => {
		change_play_status( true );
	})

	reset_button.addEventListener( "click", () => {
		change_play_status( false );
		reset_game();
	})

	gamepad_display.addEventListener( "click", event => {
		let box = event.target.closest("div");
		let index = Array.from( box.parentNode.children ).indexOf( box );
		let x = Math.trunc( index / size )
		let y = index % size

		if ( !box ) {
			return;
		}
		if ( !playing ) {
			return;
		}
		// if ( set( x, y ) ) {
		// 	check_winner( x, y, now_player );
		// }
		// else {
		// 	return;
		// }
		Promise.resolve( set( x, y ) ).then( stat => {
			if ( stat ) {
				check_winner( x, y, now_player );
			}
			else {
				return;
			}
			if ( playing ) {
				pause_timer( now_player );
				if ( now_player == "O" ) {
					now_player = "X"
				}
				else {
					now_player = "O"
				}
				current_player_display.textContent = now_player
			}
		})
		
	})

  for ( let box of gamepad_boxes ) {
		let index = Array.from( box.parentNode.children ).indexOf( box )
		let x = Math.trunc( index / size )
		let y = index % size

		box.addEventListener( "mouseenter", event => {
			if ( isBlank( x, y ) && playing ) {
				event.target.dataset.player = now_player
			}
		})

		box.addEventListener( "mouseleave", event => {
			if ( isBlank( x, y ) && playing ) {
				event.target.dataset.player = ""
			}
		})
	}
});