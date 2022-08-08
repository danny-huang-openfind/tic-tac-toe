import _ from "lodash-es";

// #region Types
type Axis = 0 | 1 | -1;
type Direction = [Axis, Axis];
type ControllerStorage<ElementType extends HTMLElement> = {
  [prop: string]: ElementType;
};
type STATE = "INITIAL" | "PLAYING" | "FINISHED";
//

// #region Contstants
const MILLI_PER_SECOND: Readonly<number> = 1000;
const TOTAL_TIME = 60 * MILLI_PER_SECOND;
const DECIMAL_DIGITS = 1;
const BLANK_PLAYER = "";
// const BLANK_PLAYER_INDEX = 0
const [BOARD_SIZE, WIN_LINE_LENGTH, _PLAYERS] = [3, 3, ["O", "X"]];
const PLAYERS: Readonly<string[]> = [BLANK_PLAYER, ..._PLAYERS];
// const PLAYER_INDEXES = [ BLANK_PLAYER_INDEX, ...Array.from( Array( _PLAYERS.length ).keys() ).map( index => index + 1 ) ]
// #endregion

// #region Document Ready
document.addEventListener("DOMContentLoaded", () => {
  // #region Get Elements' Controller
  const rootElement = document.documentElement;
  const [actions, gamepad, info] = _.map(["actions", "gamepad", "info"], (id) =>
    document.getElementById(id)
  ) as [HTMLDivElement, HTMLDivElement, HTMLDivElement];
  const timer_elements: ControllerStorage<HTMLSpanElement> = _.slice(
    PLAYERS,
    1
  ).reduce(
    (result, player, index) => ({
      ...result,
      [player]: info.children.namedItem("timer")!.children[index]!
        .children[0] as HTMLSpanElement,
    }),
    {}
  );
  const buttons: ControllerStorage<HTMLButtonElement> = [
    "start",
    "reset",
  ].reduce(
    (result, name, index) => ({
      ...result,
      [name]: actions.children[index],
    }),
    {}
  );
  // #endregion

  // #region Global Variables
  let timer = PLAYERS.map(() => TOTAL_TIME) as number[];
  let board = _.chunk(
    _.times<string | null>(BOARD_SIZE ** 2, _.constant(null)),
    BOARD_SIZE
  );
  let current_player_index: number = 0;
  let state: STATE = "INITIAL";
  let ticker: number | null = null;
  // #endregion

  // #region Utilities
  function createMappedArray<T>(size: number, mapped_method: () => T): T[] {
    // return [...Array(size)].map(mapped_method);
    return _.map(_.times(size), mapped_method);
  }

  function createElements(tag: string, length: number, classes: string[] = []) {
    return createMappedArray(length, () => {
      let template = document.createElement(tag);
      template.classList.add(...classes);
      return template;
    });
  }

  function getOpponentIndex(now_index: number) {
    return 3 - now_index;
  }

  function randomPlayer(
    players_count: number,
    start_index: number = 0
  ): number {
    return _.sample(_.range(start_index, players_count + 1))!;
  }
  // #endregion

  // #region Game Actions
  function startGame() {
    state = "PLAYING";
    current_player_index = randomPlayer(PLAYERS.length - 1, 1);

    rerender();

    countDown();
  }

  function resetGame() {
    board = _.chunk(
      _.times<string | null>(BOARD_SIZE ** 2, _.constant(null)),
      BOARD_SIZE
    );
    _.each(gamepad.children, (box) => {
      delete (box as HTMLDivElement).dataset["player"];
    });

    state = "INITIAL";
    current_player_index = 0;
    ticker = null;

    rerender();

    for (const player_index in PLAYERS) {
      setTimer(_.toNumber(player_index), TOTAL_TIME);
    }
  }

  function setPiece(
    [x, y]: [number, number],
    player_index: number,
    target: HTMLDivElement
  ) {
    board[x]![y] = PLAYERS[player_index]!;
    target.dataset["player"] = PLAYERS[player_index];
  }

  function checkResult(position: [x: number, y: number]) {
    const directions: Direction[] = [
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
    ];
    const full = board.every((row) => row.every(Boolean));

    let result = null;
    for (let direction of directions) {
      result = trace(position, direction);

      if (result) {
        break;
      }
    }

    return {
      finished: !!(result || full),
      winner: result ? current_player_index : undefined,
    };
  }

  function trace(
    position: [number, number],
    direction: Direction,
    count: number = 0
  ): boolean {
    if (checkLine(position, direction, PLAYERS[current_player_index]!)) {
      return true;
    }

    let next_position = position.map(
      (element, index) => element + (count <= 0 ? -1 : 1) * direction[index]!
    ) as [number, number];

    if (_.some([-1, BOARD_SIZE], (limit) => _.includes(next_position, limit))) {
      if (_.eq(count, 0)) {
        next_position = position.map(
          (element, index) => element + direction[index]!
        ) as [number, number];
        return trace(next_position, direction, ++count);
      } else if (Math.abs(count) >= BOARD_SIZE - 1) {
        return false;
      } else {
        next_position = position.map(
          (element, index) => element + (-count + 1) * direction[index]!
        ) as [number, number];
        return trace(next_position, direction, -count + 1);
      }
    } else {
      return trace(next_position, direction, count <= 0 ? --count : ++count);
    }
  }

  function checkLine(
    [x, y]: [number, number],
    direction: Direction,
    player: string
  ) {
    let count = 0;
    while (count < WIN_LINE_LENGTH) {
      if (_.isEqual(board?.[x]?.[y], player)) {
        return false;
      }
      ++count;
      [x, y] = _.map(
        [x, y],
        (element, index) => element! + direction[index]!
      ) as [number, number];
    }
    return true;
  }

  function switchPlayer() {
    current_player_index = getOpponentIndex(current_player_index);

    rerender();
  }

  function countDown() {
    if (_.isEqual(state, "PLAYING") || !timerUpdateAndCheck()) {
      return;
    }

    requestAnimationFrame(countDown);
  }

  function declareWinner(player?: number) {
    state = "FINISHED";
    rerender();

    requestAnimationFrame(() => {
      setTimeout(() => {
        const message = player
          ? `贏家是${PLAYERS[current_player_index]}`
          : "平手";
        alert(message);
      });
    });
  }
  // #endregion

  // #region UI rendering

  function rerender() {
    buttons["start"]!.disabled = _.includes(["PLAYING", "FINISHED"], state);
    buttons["reset"]!.disabled = _.isEqual(state, "INITIAL");
    rootElement.dataset["state"] = state.toString();
    rootElement.style.setProperty(
      "--player-now",
      `"${PLAYERS[current_player_index]}"`
    );
  }

  function timerUpdateAndCheck() {
    const now = Date.now();

    if (ticker) {
      setTimer(
        current_player_index,
        timer[current_player_index]! - (now - ticker)
      );
    }

    if (_.isEqual(timer[current_player_index], 0)) {
      declareWinner(getOpponentIndex(current_player_index));

      return false;
    }

    ticker = now;

    return true;
  }

  function setTimer(player: number, time: number) {
    if (!player || !_.includes(["O", "X"], PLAYERS[player]!)) {
      return;
    }

    const valid_time = _.max([time, 0])!;
    timer[player] = +time;
    timer_elements[PLAYERS[player]!]!.textContent = (
      valid_time / MILLI_PER_SECOND
    ).toFixed(DECIMAL_DIGITS);
  }

  // #endregion

  // #region Initialization
  function eventInitialize() {
    _.forOwn(buttons, (button, name) =>
      button.addEventListener(
        "click",
        _.isEqual(name, "start") ? startGame : resetGame
      )
    );

    gamepad.addEventListener("click", ({ target }) => {
      if (
        _.isEqual((target as HTMLDivElement).id, "gamepad") ||
        !timerUpdateAndCheck()
      ) {
        return;
      }

      const box = (target as HTMLDivElement).closest("div") as HTMLDivElement;
      const index = _.values(box.parentElement!.children).indexOf(box);
      const [x, y] = [Math.trunc(index / BOARD_SIZE), index % BOARD_SIZE];

      setPiece([x, y], current_player_index, box);
      const { finished, winner } = checkResult([x, y]);
      if (finished) {
        return declareWinner(winner);
      }

      switchPlayer();
    });
  }

  function init() {
    gamepad.append(
      ...createElements("div", BOARD_SIZE ** 2, [
        "box",
        "bg--white",
        "d-flex",
        "justify-center",
        "items-center",
      ])
    );

    for (const index in PLAYERS) {
      rootElement.style.setProperty(
        `--player-${
          _.eq(_.toNumber(index), 0) ? "none" : _.toNumber(index) - 1
        }`,
        `"${PLAYERS[index]}"`
      );
      setTimer(_.toNumber(index), TOTAL_TIME);
    }

    eventInitialize();

    rerender();
  }

  init();
  // #endregion
});
// #endregion
