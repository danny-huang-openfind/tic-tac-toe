document.addEventListener("DOMContentLoaded", () => {
  const gamepad_boxes = document.getElementsByClassName("box");
  const start_button = document.getElementById("button-start");
  const reset_button = document.getElementById("button-reset");
  const current_player_display = document.getElementsByClassName("current-player")[0];
  const gamepad_display = document.getElementsByClassName("gamepad")[0];
  
  [ start_button.disabled, reset_button.disabled ] = [ false, true ]

  let ticker = undefined;

  let timer = {
    circle: {
      display: document.getElementById("circle-timer").getElementsByClassName("timer")[0]
    },
    cross: {
      display: document.getElementById("cross-timer").getElementsByClassName("timer")[0]
    },
  }

  Object.keys( timer ).forEach( key => {
    timer[ key ].progress = 0;
    timer[ key ].pause = false;
    timer[ key ].text = document.createTextNode("60.0")
    timer[ key ].current = +timer[ key ].text.nodeValue
    timer[ key ].display.appendChild( timer[ key ].text )
  })

  let size = 3;

  let virtual_gamepad = new Array( size ).fill( null ).map( () => new Array( size ).fill( undefined ) )

  let now_player = "O";
  let playing = false;

  Array( size ** 2 ).fill( null ).forEach( () => {
    let template = document.createElement( "div" )
    template.classList.add( "box" )
    template.dataset.player = ""
    gamepad_display.appendChild( template )
  })

  const isBoardFull = () => {
    let flag = true
    virtual_gamepad.every( row => row.every(
      element => {
        if ( !element ) {
          flag = false
        }
      }
    ))
    return flag;
  }

  const set = ( x, y ) => {
    if ( virtual_gamepad[ x ][ y ] ) {
      return false;
    }
    virtual_gamepad[ x ][ y ] = now_player;
    return true;
  }
  
  const declare_winner = ( who, isTie ) => {
    change_play_status( false );
    !who && !!isTie ? alert("平手") : alert(`贏家是${ who }`)
  }

  const check_winner = ( x, y, player ) => {
    let details = {
      horizontal: {
        count: 0,
        flag: true
      },
      vertical: {
        count: 0,
        flag: true
      },
      slash: {
        count: 0,
        flag: false
      },
      backslash: {
        count: 0,
        flag: false
      }
    }
    
    if ( x === y ) {
      details.backslash.flag = true;
    }

    if ( x + y == size - 1 ) {
      details.slash.flag = true;
    }

    for ( let index in virtual_gamepad[ 0 ] ) { // as same as size
      for ( let key of Object.keys( details ) ) {
        if ( details[ key ].flag ) {
          if ( virtual_gamepad[
            key == "horizontal" 
            ? x 
            : index
          ]
          [
            key == "vertical" 
            ? y 
            : key == "slash" 
              ? size - 1 - index 
              : index 
          ] == player ) {
            ++details[ key ].count;
            if ( details[ key ].count === size ) {
              declare_winner( player )
              return
            }
            if ( index == size - 1 && details[ key ].count < size ) {
              details[ key ].count = 0;
            }
          }
          else {
            if ( details[ key ].count >= 1 ) {
              details[ key ].count = 0;
              details[ key ].flag = false
            }
          }
        }
      }
    }
    
    if ( isBoardFull() && playing ) {
      declare_winner( undefined, true )
    }
  }

  const reset_game = () => {
    virtual_gamepad = new Array( size ).fill( null ).map( () => Array( size ).fill( undefined ) )

    for ( let box of gamepad_boxes ) {
      box.dataset.player = ""
      box.classList.remove("occupied")
    }

    Object.keys( timer ).forEach( key => {
      timer[ key ].text.nodeValue = "60.0"
    })
    current_player_display.textContent = "";
    [ start_button.disabled, reset_button.disabled ] = [ reset_button.disabled, start_button.disabled ]
  }
  
  const change_play_status = to => {
    if ( to ) {
      playing = true;
      pause_timer("cross");
      window.requestAnimationFrame( set_timer )
      current_player_display.textContent = "O";
      now_player = "O";
      gamepad_display.style.setProperty("--player", "'O'")
      gamepad_display.style.cursor = "pointer"
      debugger
      [ start_button.disabled, reset_button.disabled ] = [ reset_button.disabled, start_button.disabled ]
    }
    else {
      playing = false;
      gamepad_display.style.setProperty("--player", "")
      gamepad_display.style.cursor = "default"
      ticker = undefined
      Object.keys( timer ).forEach( key => {
        timer[ key ].pause = true
        timer[ key ].current = ( 60 ).toFixed( 1 )
      })
    }
  }

  const set_timer = () => {
    if ( !ticker ) {
      ticker = Date.now()
    }

    for ( let key of Object.keys( timer )  ) {
      if ( !timer[ key ].pause ) {
        timer[ key ].progress += Date.now() - ticker
        if ( timer[ key ].progress >= 100 ) {
          timer[ key ].current = ( timer[ key ].current - 0.1 ).toFixed(1)

          timer[ key ].text.nodeValue = timer[ key ].current
          if ( timer[ key ].current < 0 ) {
            declare_winner( key == "circle" ? "X" : "O" )
            timer[ key ].text.nodeValue = "0.0";
          }

          timer[ key ].progress = 0
        }
      }
    }

    ticker = Date.now()

    window.requestAnimationFrame( set_timer )
  }

  const pause_timer = player => {
    Object.keys( timer ).forEach( key => {
      timer[ key ].pause = ( key == player )
    })
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

    if ( !box || !playing ) {
      return;
    }

    Promise.resolve( set( x, y ) ).then( stat => {
      if ( stat ) {
        box.classList.add( "occupied" )
        box.dataset.player = now_player;
        check_winner( x, y, now_player );
      }
      else {
        return;
      }

      if ( playing ) {
        pause_timer( now_player == "O" ? "circle" : "cross" );
        now_player = now_player == "O" ? "X" : "O"
        gamepad_display.style.setProperty("--player", JSON.stringify( now_player ))
        current_player_display.textContent = now_player
      }
    })		
  })
});