const game_initialize = () => {
	console.log("test")
}

const serial_to_data = serial => {
  serial = serial.split("-");
	for ( let index in serial ) {
		serial[ index ] = parseInt( serial[ index ] );
	}
	return serial;
}

document.addEventListener("DOMContentLoaded", () => {
	const gamepad_boxes = document.getElementsByClassName("box");
	const start_button = document.getElementById("button-start");
	const reset_button = document.getElementById("button-reset");
	const circle_timer_display = document.getElementById("circle-timer").getElementsByClassName("timer")[0];
	const cross_timer_display = document.getElementById("cross-timer").getElementsByClassName("timer")[0];
	const current_player_display = document.getElementsByClassName("current-player")[0];
	const gamepad_display = document.getElementsByClassName("gamepad")[0];

	let circle_timer = undefined;
	let cross_timer = undefined;
	let circle_timer_pause =  false;
	let cross_timer_pause = false;

	let size = 3;

	let virtual_gamepad = [
		[ undefined, undefined, undefined ],
		[ undefined, undefined, undefined ],
		[ undefined, undefined, undefined ]
	]

	let now_player = "O";
	let playing = false;

	const isBlank = ( x, y ) => {
		if ( !virtual_gamepad[ x - 1 ][ y - 1 ] ) {
			return true;
		}
		else {
			return false;
		}
	}

	const isBoardFull = () => {
		for ( let i = 0 ; i < size * size ; ++i ) {
			if ( !virtual_gamepad[ parseInt( i / size ) ][ parseInt( i % size ) ] ) {
				return false
			}
		}
		return true;
	}

	const set = ( x, y ) => {
		if ( !isBlank( x, y ) ) {
			return false;
		}
		virtual_gamepad[ x - 1 ][ y - 1 ] = now_player;
		return true;
	}
	
	const check_winner = ( x, y, player ) => {
		let same_count = 0;
		let line_count = 0
		--x; --y;

		for ( let i = 0 ; i < size ; ++i ) {
			if ( virtual_gamepad[ x ][ i ] == player ) {
				++same_count;
				if ( i == size - 1 && same_count < size ) {
					same_count = 0;
				}
			}
			else {
				if ( same_count >= 1 ) {
					same_count = 0;
					break;
				}
			}
		}

		if ( same_count >= size ) {
			++line_count;
			same_count = 0;
		}

		for ( let i = 0 ; i < size ; ++i ) {
			if ( virtual_gamepad[ i ][ y ] == player ) {
				++same_count;
				if ( i == size - 1 && same_count < size ) {
					same_count = 0;
				}
			}
			else {
				if ( same_count >= 1 ) {
					same_count = 0;
					break;
				}
			}
		}

		if ( same_count >= size ) {
			same_count = 0;
			++line_count;
		}

		if ( x == y ) {
			for ( let i = 0 ; i < size ; ++i ) {
				if ( virtual_gamepad[ i ][ i ] == player ) {
					++same_count;
					if ( i == size - 1 && same_count < size ) {
						same_count = 0;
					}
				}
				else {
					if ( same_count >= 1 ) {
						same_count = 0;
						break;
					}
				}
			}
		}

		if ( same_count >= size ) {
			++line_count;
			same_count = 0;
		}

		if ( x + y == size - 1 ) {
			for ( let i = 0 ; i < size ; ++i ) {
				if ( virtual_gamepad[ i ][ size - 1 - i ] == player ) {
					++same_count;
					if ( i == size - 1 && same_count < size ) {
						same_count = 0;
					}
				}
				else {
					if ( same_count >= 1 ) {
						same_count = 0;
						break;
					}
				}
			}
		}

		if ( same_count >= size ) {
			++line_count;
			same_count = 0;
		}

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
		for ( let i = 0 ; i < size ; ++i ) {
			for ( let j = 0 ; j < size ; ++j ) {
				virtual_gamepad[ i ][ j ] = undefined;
			}
		}

		for ( let box of gamepad_boxes ) {
			box.innerHTML = ""
		}

		clearInterval( circle_timer );
		clearInterval( cross_timer );
		circle_timer_display.textContent = "60.0";
		cross_timer_display.textContent = "60.0";
		current_player_display.textContent = "";
		start_button.disabled = false;
		reset_button.disabled = true;
	}
	
	const change_play_status = to => {
		if ( to ) {
			playing = true;
			set_timer();
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
		circle_timer = setInterval( () => {
			if ( !circle_timer_pause ) {
				let current = parseFloat( circle_timer_display.textContent ) - 0.1
				if ( current < 0 ) {
					current = 0;
					force_win("X");
				}
				current = Math.round( current * 10 ) / 10
				if ( current.toString().indexOf(".") == -1 ) {
					current = current + ".0"
				}
				circle_timer_display.textContent = current
			}
		}, 100 )

		cross_timer = setInterval( () => {
			if ( !cross_timer_pause ) {
				let current = parseFloat( cross_timer_display.textContent ) - 0.1
				if ( current < 0 ) {
					current = 0;
					force_win("O")
				}
				current = Math.round( current * 10 ) / 10
				if ( current.toString().indexOf(".") == -1 ) {
					current = current + ".0"
				}
				cross_timer_display.textContent = current
			}
		}, 100 )

		cross_timer_pause = true;
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

  for ( let box of gamepad_boxes ) {
		box.addEventListener( "mouseenter", event => {
			if ( isBlank( ...serial_to_data( event.target.dataset.serial ), virtual_gamepad ) && playing ) {
				event.target.textContent = now_player
			}
		})

		box.addEventListener( "mouseleave", event => {
			if ( isBlank( ...serial_to_data( event.target.dataset.serial ), virtual_gamepad ) && playing ) {
				event.target.textContent = ""
			}
		})

		box.addEventListener( "click", event => {
			if ( !playing ) {
				return;
			}
			if ( set( ...serial_to_data( event.target.dataset.serial ) ) ) {
				check_winner( ...serial_to_data( event.target.dataset.serial ), now_player );
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
			}
			
			current_player_display.textContent = now_player
		})
	}
});