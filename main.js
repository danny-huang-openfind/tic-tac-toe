// #region Contstants
const MILLI_PER_SECOND = 1000
const TOTAL_TIME = 60 * MILLI_PER_SECOND
const DECIMAL_DIGITS = 1
const STATES = ["INITIAL", "PLAYING", "FINISHED"].reduce( ( result, currentKey ) => ({ ...result, [ currentKey ]: currentKey }), {})
const BLANK_PLAYER = ""
// const BLANK_PLAYER_INDEX = 0
const [ BOARD_SIZE, WIN_LINE_LENGTH, _PLAYERS ] = [ 3, 3, [ "O", "X" ] ]
const PLAYERS = [ BLANK_PLAYER, ..._PLAYERS ];
// const PLAYER_INDEXES = [ BLANK_PLAYER_INDEX, ...Array.from( Array( _PLAYERS.length ).keys() ).map( index => index + 1 ) ]
// #endregion

// #region Document Ready
document.addEventListener( "DOMContentLoaded", () => {
  // #region Get Elements' Controller
  const rootElement = document.documentElement
  const [ actions, gamepad, info ] = [ "actions", "gamepad", "info" ].map( id => document.getElementById( id ) )
  const timer_elements = PLAYERS.reduce( 
    ( result, player, index ) => ({
      ...result,
      [ player ]: info.children.timer.children[ index - 1 ].children[ 0 ] 
    })
  )
  const buttons = [ "start", "reset" ].reduce(
    ( result, name, index ) => ({
      ...result,
      [ name ]: actions.children[ index ]
    }),
    {}
  )
  // #endregion

  // #region Global Variables
  let timer = PLAYERS.map( () => TOTAL_TIME )
  let board = createMappedArray( BOARD_SIZE, () => Array( BOARD_SIZE ).fill( null ) )
  let current_player_index = 0
  let state = STATES.INITIAL
  let ticker = null
  // #endregion

  // #region Utilities
  function createMappedArray( size, mapped_method ) {
    return [ ...Array( size ) ].map( mapped_method )
  }

  function createElements( tag, length, classes = [] ) {
    return createMappedArray( length, () => {
      let template = document.createElement( tag )
      template.classList.add( ...classes )
      return template
    })
  }

  function getOpponentIndex( now_index ) {
    return 3 - now_index
  }

  function randomPlayer( players_count ) {
    return Math.floor( Math.random() * +players_count + 1 )
  }
  // #endregion

  // #region Game Actions
  function startGame() {
    state = STATES.PLAYING
    current_player_index = randomPlayer( PLAYERS.length - 1 )

    rerender()

    countDown()
  }

  function resetGame() {
    board = new Array( BOARD_SIZE ).fill( null ).map( () => new Array( BOARD_SIZE ).fill( null ) )
    Array.from( gamepad.children ).forEach
    
    state = STATES.INITIAL
    current_player_index = 0
    ticker = null

    rerender()

    for ( const player in PLAYERS ) {
      setTimer( player, TOTAL_TIME )
    }
  }

  function setPiece( [ x, y ], player_index, target ) {
    board[ x ][ y ] = PLAYERS[ player_index ]
    target.dataset.player = PLAYERS[ player_index ]
  }

  function checkResult( position ) {
    const directions = [
      [ 0, 1 ],
      [ 1, 1 ],
      [ 1, 0 ],
      [ 1, -1 ]
    ]
    const full = board.every( row => row.every( Boolean ) )
    
    let result = null ;
    for ( let direction of directions ) {
      result = trace( position, direction )

      if ( result ) {
        break
      }
    }

    return { finished: !!( result || full ), winner: result ? PLAYERS[ current_player_index ] : null }
  }
  
  function trace( position, direction, count = 0 ) {
    if ( checkLine( position, direction, PLAYERS[ current_player_index ] ) ) {
      return true
    }

    let next_position = position.map( ( element, index ) => element + ( count <= 0 ? -1 : 1 ) * direction[ index ] )

    if ( next_position.includes( -1 ) || next_position.includes( BOARD_SIZE ) ) {
      if ( count == 0 ) {
        next_position = position.map( ( element, index ) => element + direction[ index ] )
        return trace( next_position, direction, ++count )
      }
      else if ( Math.abs( count ) >= BOARD_SIZE - 1 ) {
        return false
      }
      else {
        next_position = position.map( ( element, index ) => element + ( ( -count + 1 ) * direction[ index ] ) )
        return trace( next_position, direction, ( -count + 1 ) )
      }
    }
    else {
      return trace( next_position, direction, count <= 0 ? --count : ++count )
    }
  }

  function checkLine( [ x, y ], direction, player ) {
    count = 0
    while( count < WIN_LINE_LENGTH ) {
      if ( board?.[ x ]?.[ y ] !== player ) {
        return false
      }
      ++count;
      [ x, y ] = [ x, y ].map( ( element, index ) => element + direction[ index ] )
    }
    return true
  }

  function switchPlayer() {
    current_player_index = getOpponentIndex( current_player_index )

    rerender()
  }

  function countDown() {
    if ( state !== STATES.PLAYING || !timerUpdateAndCheck() ) {
      return
    }

    requestAnimationFrame( countDown )
  }

  function declareWinner( player ) {
    state = STATES.FINISHED
    rerender()

    requestAnimationFrame( () => {
      setTimeout( () => {
        const message = player ? `贏家是${ PLAYERS[ current_player_index ] }` : "平手"
        alert( message )
      })
    })
  }
  // #endregion

  // #region UI rendering
  
  function rerender() {
    buttons.start.disabled = [ STATES.PLAYING, STATES.FINISHED ].includes( state )
    buttons.reset.disabled = ( state === STATES.INITIAL )
    rootElement.dataset.state = state
    rootElement.style.setProperty( "--player-now", `"${ PLAYERS[ current_player_index ] }"` )
  }

  function timerUpdateAndCheck() {
    const now = Date.now()

    if ( ticker ) {
      setTimer( current_player_index, timer[ current_player_index ] - ( now - ticker ) )
    }

    if ( timer[ current_player_index ] === 0 ) {
      declareWinner( getOpponentIndex( current_player_index ) )

      return false
    }

    ticker = now

    return true
  }

  function setTimer( player, time ) {
    if ( !+player ) {
      return
    }

    const valid_time = Math.max( time, 0 )
    timer[ player ] = time
    timer_elements[ PLAYERS[ player ] ].textContent = ( valid_time / MILLI_PER_SECOND ).toFixed( DECIMAL_DIGITS )
  }

  // #endregion

  // #region Initialization
  function eventInitialize() {
    buttons.start.addEventListener( "click", startGame )
    buttons.reset.addEventListener( "click", resetGame )

    gamepad.addEventListener( "click", ({ target }) => {
      if ( target.id === "gamepad" || !timerUpdateAndCheck() ) {
        return
      }

      const box = target.closest("div")
      const index = Array.from( box.parentNode.children ).indexOf( box );
      const [ x, y ] = [ Math.trunc( index / BOARD_SIZE ), index % BOARD_SIZE ]

      setPiece( [ x, y ], current_player_index, box )
      const { finished, winner } = checkResult( [ x, y ] )
      if ( finished ) {
        return declareWinner( winner )
      }

      switchPlayer()
    })
  }

  function init() {
    gamepad.append( ...createElements(
      "div",
      BOARD_SIZE ** 2,
      [ "box", "bg--white", "d-flex", "justify-center", "items-center" ]
    ))

    for ( const index in PLAYERS ) {
      rootElement.style.setProperty( `--player-${ index == 0 ? "none" : index - 1 }`, `"${ PLAYERS[ index ] }"` )
      setTimer( index, TOTAL_TIME )
    }

    eventInitialize()

    rerender()
  }

  init()
  // #endregion
})
// #endregion