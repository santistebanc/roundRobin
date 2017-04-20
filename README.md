# Round-Robin style tournament bracket generator
A highly configurable round robin tournament bracket generator. Multiple players per match supported.

Built with React.js and Baobab data tree. Uses Web Workers to run the bracket-generating algorithm without blocking the app. The user inputs the names of the players, the size and number of groups in each cycle. The players are arranged randomly in groups taking care of minimizing the amount of repetitions.
