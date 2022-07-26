document.addEventListener("DOMContentLoaded", () => {
  // #region Get Elements' Controller
  const gamepad_boxes = document.getElementsByClassName("box");
  const [
          start_button, reset_button,
          current_player_display,
          gamepad_display
        ] = [
          "button-start",
          "button-reset",
          "current-player",
          "gamepad"
        ].map( id => document.getElementById( id ) )

  let ticker = undefined;

  let timer = [ "circle", "cross" ].reduce(
    ( result, currentKey ) => ({
      ...result,
      [ currentKey ]: { display: document.getElementById(`${ currentKey }-timer`).getElementsByClassName("timer")[ 0 ] }
    })
  , {})

  Object.keys( timer ).forEach( key => {
    timer[ key ] = {
    ...timer[ key ],
    ...Object.fromEntries([
      [ "progress", 0 ],
      [ "text", document.createTextNode("60.0") ],
      [ "current", ( 60 ).toFixed( 1 ) ]
    ])}
    timer[ key ].display.appendChild( timer[ key ].text ) 
  })
  // #endregion

  // #region Global Variables
  let size = 3;

  let virtual_gamepad = new Array( size ).fill( null ).map( () => new Array( size ).fill( undefined ) )

  let now_player = "O";
  let playing = false;
  // #endregion

  // #region UI Initialization
  const renderUI = () => {
    start_button.disabled = playing
    reset_button.disabled = !playing
    gamepad_display.style.setProperty("--player", JSON.stringify( now_player ))
  }

  renderUI()

  Array( size ** 2 ).fill( null ).forEach( () => {
    let template = document.createElement( "div" )
    template.classList.add( "box" )
    template.dataset.player = ""
    gamepad_display.appendChild( template )
  })
  // #endregion

  // #region Utilities

  const isBoardFull = () => {
    virtual_gamepad.every( row => row.every( element => Boolean( element ) ))
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

    requestAnimationFrame( () => {
      setTimeout( () => {
        !who && !!isTie ? alert("平手") : alert(`贏家是${ who }`)  
      })
    })
  }

  const check_winner = ( x, y, player ) => {
    let details = [ "horizontal", "vertical", "slash", "backslash" ].reduce(
      ( result, currentKey ) => ({ ...result, [ currentKey ]: { count: 0 } }), {}
    )

    for ( let index in virtual_gamepad[ 0 ] ) { // as same as size
      for ( let key of Object.keys( details ) ) {
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
    renderUI()
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
      [ start_button.disabled, reset_button.disabled ] = [ true, false ]
      renderUI()
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
  // #endregion

  // #region Timer Related
  const set_timer = () => {
    let current_player = now_player === "O" ? "circle" : "cross"

    if ( !ticker ) {
      ticker = Date.now()
    }

    if ( !playing ) {
      return
    }

    timer[ current_player ].progress += Date.now() - ticker
    if ( timer[ current_player ].progress >= 100 ) {
      timer[ current_player ].current = ( timer[ current_player ].current - 0.1 ).toFixed(1)

      timer[ current_player ].text.nodeValue = timer[ current_player ].current
      if ( timer[ current_player ].current == 0 ) {
        declare_winner( current_player == "circle" ? "X" : "O" )
      }

      timer[ current_player ].progress = 0
    }

    ticker = Date.now()

    window.requestAnimationFrame( set_timer )
  }

  const pause_timer = player => {
    Object.keys( timer ).forEach( key => {
      timer[ key ].pause = ( key == player )
    })
  }
  // #endregion

  // #region EventListener settings
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
        renderUI()
        current_player_display.textContent = now_player
      }
    })
  })
  // #endregion	
});