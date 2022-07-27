// #region Contstants
const TOTAL_TIME = 60 * 1000
const DECIMAL_DIGITS = 1
const STATES = ["INITIAL", "PLAYING", "FINISHED"].reduce( ( result, currentKey ) => ({ ...result, [ currentKey ]: currentKey }), {})
const BLANK_PLAYER = ""
const BLANK_PLAYER_INDEX = 0
const [ BOARD_SIZE, WIN_LINE_LENGTH, _PLAYERS ] = [ 3, 3, [ "O", "X" ] ]
const PLAYERS = [ BLANK_PLAYER, ..._PLAYERS ];
const PLAYER_INDEXES = [ BLANK_PLAYER_INDEX, ...Array.from( Array( _PLAYERS.length ).keys() ).map( index => index + 1 ) ]
// #endregion

// #region Document Ready
document.addEventListener( "DOMContentLoaded", () => {
  // #region Get Elements' Controller
  const [ actions, gamepad, info ] = [ "actions", "gamepad", "info" ].map( id => document.getElementById( id ) )
  const current_player_display = info.children.current.children[ 0 ]
  const timer_elements = PLAYER_INDEXES.reduce( 
    ( result, index ) => ({
      ...result,
      [ PLAYERS[ index ] ]: {
        name_display: info.children.timer.children[ index - 1 ].children[ 0 ],
        time_display: info.children.timer.children[ index - 1 ].children[ 1 ] 
      }
    })
  )
  console.log( current_player_display )
  const buttons = [ "start", "reset" ].reduce(
    ( result, name, index ) => ({
      ...result,
      [ name ]: actions.children[ index ]
    }),
    {}
  )
  // #endregion
})
// #endregion