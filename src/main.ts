import _ from "lodash-es";
import type { Direction, ControllerStorage, STATE } from "./types";
import {
  animationFrames,
  BehaviorSubject,
  filter,
  fromEvent,
  map,
  startWith,
} from "rxjs";

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
  const [actions, gamepad] = _.map(["actions", "gamepad"], (id) =>
    document.getElementById(id)
  ) as [HTMLDivElement, HTMLDivElement, HTMLDivElement];
  const timer_elements: ControllerStorage<HTMLSpanElement> = _.reduce(
    _.slice(PLAYERS, 1),
    (result, player, index) =>
      _.assign(result, {
        [player]:
          document.getElementById("timer")!.children[index]!.children[0],
      }),
    {}
  );
  // #endregion

  // #region Global Variables
  let timer = _.map(PLAYERS, () => TOTAL_TIME) as number[];
  let board = _.chunk(
    _.times<string | null>(BOARD_SIZE ** 2, _.constant(null)),
    BOARD_SIZE
  );

  let current_player_index: number = 0;
  let state: STATE = "INITIAL";
  let ticker: number | null = null;
  // #endregion

  // #region Observables
  const timer$ = animationFrames().pipe(
    filter(() => _.isEqual(state, "PLAYING"))
  );

  const renderer$ = new BehaviorSubject<{ state: STATE; player: string }>({
    state,
    player: PLAYERS[current_player_index]!,
  });
  // #endregion

  // #region Utilities
  function createMappedArray<T>(size: number, mapped_method: () => T): T[] {
    return _.map(_.range(size), mapped_method);
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

  function randomPlayer(players_count: number) {
    return _.random(0, players_count - 1) + 1;
  }
  // #endregion

  // #region Game Actions
  function startGame() {
    state = "PLAYING";
    current_player_index = randomPlayer(PLAYERS.length - 1);

    renderer$.next({ state, player: PLAYERS[current_player_index]! });

    // countDown();
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

    renderer$.next({ state, player: PLAYERS[current_player_index]! });

    _.each(_.range(PLAYERS.length), (index) => {
      setTimer(index, TOTAL_TIME);
    });
  }

  function setPiece([x, y]: [number, number], player_index: number) {
    board[x]![y] = PLAYERS[player_index]!;
    (gamepad.children[x * BOARD_SIZE + y] as HTMLDivElement).dataset["player"] =
      PLAYERS[player_index];
  }

  function checkResult(position: [x: number, y: number]) {
    const directions: Direction[] = [
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
    ];
    const full = _.every(board, (row) => _.every(row, _.identity));

    let result = null;
    _.each(directions, (direction) => {
      result = trace(position, direction);

      return !result;
    });

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

    let next_position = _.map(
      position,
      (element, index) => element + (count <= 0 ? -1 : 1) * direction[index]!
    ) as [number, number];

    if (_.some(next_position, (coord) => _.includes([-1, BOARD_SIZE], coord))) {
      if (_.eq(count, 0)) {
        next_position = _.map(
          position,
          (element, index) => element + direction[index]!
        ) as [number, number];
        return trace(next_position, direction, ++count);
      } else if (Math.abs(count) >= BOARD_SIZE - 1) {
        return false;
      } else {
        next_position = _.map(
          position,
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
    while (_.inRange(count, WIN_LINE_LENGTH)) {
      if (!_.isEqual(_.property(`[${x}][${y}]`)(board), player)) {
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

    renderer$.next({ state, player: PLAYERS[current_player_index]! });
  }

  function declareWinner(player?: number) {
    state = "FINISHED";
    renderer$.next({ state, player: PLAYERS[current_player_index]! });

    requestAnimationFrame(() => {
      setTimeout(() => {
        const message = player ? `贏家是${PLAYERS[player]}` : "平手";
        alert(message);
      });
    });
  }
  // #endregion

  // #region UI rendering

  function timerUpdateAndCheck(now: number = Date.now()) {
    if (ticker) {
      setTimer(
        current_player_index,
        timer[current_player_index]! - (now - ticker)
      );
    }

    if (timer[current_player_index]! <= 0) {
      _.flow([getOpponentIndex, declareWinner])(current_player_index);
    }

    ticker = now;
  }

  function setTimer(player: number, time: number) {
    if (!player || !_.includes(["O", "X"], PLAYERS[player]!)) {
      return;
    }

    const valid_time = _.max([time, 0])!;
    timer[player] = time;
    timer_elements[PLAYERS[player]!]!.textContent = (
      valid_time / MILLI_PER_SECOND
    ).toFixed(DECIMAL_DIGITS);
  }

  // #endregion

  // #region Initialization
  function eventInitialize() {
    fromEvent(actions, "click")
      .pipe(
        filter(({ target }) =>
          _.isEqual((target as HTMLDivElement).tagName, "BUTTON")
        )
      )
      .subscribe(({ target }) => {
        const index = _.values(
          (target as HTMLButtonElement).parentElement!.children
        ).indexOf(target as HTMLButtonElement);
        _.eq(index, 0) ? startGame() : resetGame();
      });

    fromEvent(gamepad, "click")
      .pipe(
        filter(
          ({ target }) => !_.isEqual((target as HTMLDivElement).id, "gamepad")
        ),
        map(({ target }) => {
          const box = (target as HTMLDivElement).closest(
            "div"
          ) as HTMLDivElement;
          const index = _.values(box.parentElement!.children).indexOf(box);
          return [Math.trunc(index / BOARD_SIZE), index % BOARD_SIZE];
        })
      )
      .subscribe(([x, y]) => {
        setPiece([x!, y!], current_player_index);
        const { finished, winner } = checkResult([x!, y!]);
        finished ? declareWinner(winner) : switchPlayer();
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

    timer$.subscribe((now) => timerUpdateAndCheck(now.timestamp));

    eventInitialize();

    // rerender();
    renderer$
      .pipe(startWith({ state, player: PLAYERS[current_player_index] }))
      .subscribe(({ state, player }) => {
        (actions.children[0]! as HTMLButtonElement).disabled = [
          "PLAYING",
          "FINISHED",
        ].includes(state);
        (actions.children[1]! as HTMLButtonElement).disabled = _.isEqual(
          state,
          "INITIAL"
        );
        rootElement.dataset["state"] = state.toString();
        rootElement.style.setProperty("--player-now", `"${player}"`);
      });
  }

  init();
  // #endregion
});
// #endregion
