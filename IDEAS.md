# Game ideas

Running list so ideas survive across sessions. Status: `idea` (not started),
`built` (live). When a game ships, move its entry to the built list and link
the PR. Keep the constraint set in mind when adding entries: one mechanic per
game, rounds under ~30 seconds, no typing code, the failure feedback must say
*why* in terms of the underlying concept.

Design direction from the current thread: games can also be *disguised* —
presented as an ordinary puzzle game whose rules secretly are the algorithm.
The player discovers the invariant because optimal play requires it, not
because a quiz told them.

## Shipped

- **Spot the Pattern** — read a problem, pick the technique. Trains problem→technique mapping.
- **Complexity Duel** — read code, name the Big-O.
- **Bug Hunt** — identify the bug behind a failing case and pick the fix.
- **Binary Search Trainer** — find a target in a sorted array within the optimal comparison budget; procedurally generated.
- **Train Yard** — route boxcars through one siding into a target order; the siding is a stack (LIFO). Wrong send or a jammed yard fails and names the constraint. (#10)

## Ideas

- **Pointer Race** — tap to move left/right pointers against a target sum before the timer runs out. Teaches two-pointer convergence and when the pointers move.
- **Complexity Duel: head-to-head** — two snippets, one input size shown, pick which one wins. (Refinement of shipped Complexity Duel; amortized and worst-case follow-ups.)
- **BFS/DFS Flood** — draw the exploration order on a grid by clicking cells before the timer; the grid shows the correct order after. Teaches traversal order, and why BFS queues and DFS stacks.
- **Power the Town** — wire houses to a substation with limited cable at minimum total cost. Teaches minimum spanning tree (Kruskal's "cheapest edge that doesn't loop"); cycles glow red as the tell.
- **Crate Crane** — crates arrive out of order; you must always grab the most urgent one. Teaches priority queue / heap; crates visibly sink to their heap position on insert.
- **Speed Parkour / Route Count** — count paths across a rooftop grid with missing tiles. Teaches dynamic programming and memoization; repeated sub-paths render as already-paid-for.
- **Game Show Higher/Lower** — cheesy host, numbered doors, higher/lower feedback; scoreboard rewards narrowing fastest. (Covered by Binary Search Trainer; kept as a re-skin idea.)
- **Vending Change** — hand back exact change with the fewest coins; some denominations run out. Teaches greedy vs. DP coin change and where greedy fails.
- **Lost & Found** — match identical ID cards at speed. Teaches hashing / O(1) lookup vs. scanning.
- **Train Yard II: impossible orders** — extension of Train Yard: show a target and ask whether it's reachable through one siding (some are not). Teaches the stack-permutation characterization instead of just executing it.
