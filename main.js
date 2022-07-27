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
  const [ actions, gamepad, info ] = [ "actions", "gamepad", "info" ].map( id => document.getElementById( id ) )
  const current_player_display = info.children.current.children[ 0 ]
  const timer_elements = PLAYERS.reduce( 
    ( result, player, index ) => ({
      ...result,
      [ player ]: {
        name_display: info.children.timer.children[ index - 1 ].children[ 0 ],
        time_display: info.children.timer.children[ index - 1 ].children[ 1 ] 
      }
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
  // #endregion

  // #region Initialization
  function init() {
    gamepad.append( ...createElements( "div", BOARD_SIZE ** 2, [ "bg--white", "d-flex", "justify-center", "items-center" ] ) )
  }

  init()
  // #endregion
})
// #endregion