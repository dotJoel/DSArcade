'use strict';
window.BUGHUNT_QUESTIONS = [
  {
    q: "The search hangs on [2, 5] when looking for 5. What is the bug?",
    code: "while (lo <= hi) {\n  const mid = Math.floor((lo + hi) / 2);\n  if (a[mid] === target) return mid;\n  if (a[mid] < target) lo = mid;\n  else hi = mid - 1;\n}\nreturn -1;",
    options: ["Advance lo to mid + 1 when a[mid] is too small", "Set hi to mid + 1", "Change the loop to lo < hi", "Return hi instead of -1"],
    answer: 0,
    why: "When mid is 0, lo = mid makes no progress, so the loop repeats forever. Exclude the known-too-small midpoint with lo = mid + 1."
  },
  {
    q: "This Two Sum returns [0, 0] for [4], target 8. What is the fix?",
    code: "for (let i = 0; i < nums.length; i++) {\n  seen.set(nums[i], i);\n  const need = target - nums[i];\n  if (seen.has(need)) return [seen.get(need), i];\n}",
    options: ["Check for the complement before inserting the current value", "Use a Set instead of a Map", "Sort nums before the loop", "Start i at 1"],
    answer: 0,
    why: "The current value is already in seen, so it can match itself. Look up the complement first, then store this value for later elements."
  },
  {
    q: "For [-8, -3, -6], this returns 0, but the maximum subarray sum is -3. What is wrong?",
    code: "let best = 0, current = 0;\nfor (const x of nums) {\n  current = Math.max(0, current + x);\n  best = Math.max(best, current);\n}\nreturn best;",
    options: ["Initialize best and current from the first element", "Sort nums first", "Replace Math.max with Math.min", "Skip negative values"],
    answer: 0,
    why: "Starting at zero permits the empty subarray to win. If the problem requires a non-empty subarray, initialize from nums[0] (and start at index 1)."
  },
  {
    q: "The validator accepts '([)]'. Which fix catches the bug?",
    code: "if (c === ')' || c === ']' || c === '}') {\n  stack.pop();\n} else {\n  stack.push(c);\n}",
    options: ["Check that the popped opener matches this closer", "Use a queue instead of a stack", "Ignore parentheses and validate braces only", "Sort the string before checking"],
    answer: 0,
    why: "A non-empty stack is not enough: each closer must match the most recent opener. For '([)]', ')' incorrectly pops '['."
  },
  {
    q: "Reversing 1 → 2 → 3 leaves 3 pointing to 2, but loses node 3 from the result. Why?",
    code: "let prev = null, curr = head;\nwhile (curr.next) {\n  const next = curr.next;\n  curr.next = prev;\n  prev = curr;\n  curr = next;\n}\nreturn prev;",
    options: ["The loop stops before reversing the tail; iterate while curr is not null", "Initialize prev to head.next", "Traverse from the tail instead", "Return curr.next"],
    answer: 0,
    why: "The final node is never processed because curr.next is null there. Loop while curr !== null, saving next before changing curr.next."
  },
  {
    q: "This tree-depth function misses the longest path when one side is much deeper. What should change?",
    code: "function depth(node) {\n  if (!node) return 0;\n  return 1 + Math.min(depth(node.left), depth(node.right));\n}",
    options: ["Use Math.max for the two child depths", "Return 0 for a leaf", "Swap left and right", "Use Math.min but add 2"],
    answer: 0,
    why: "Maximum depth follows the deeper child, so combine with max, not min."
  },
  {
    q: "DFS over an undirected graph can recurse forever on an edge back to the parent. What is missing?",
    code: "function dfs(v) {\n  for (const u of graph[v]) {\n    if (!visited.has(u)) dfs(u);\n  }\n  visited.add(v);\n}",
    options: ["Mark v visited before exploring its neighbors", "Use a queue instead of recursion", "Remove all reverse edges", "Mark only leaf nodes visited"],
    answer: 0,
    why: "In a cycle, a neighbor can reach v again before v is marked. Mark on entry, then explore neighbors."
  },
  {
    q: "For sorted [1, 1, 2], this writes the right unique values but reports length 1. What is the off-by-one?",
    code: "let k = 0;\nfor (let i = 1; i < nums.length; i++) {\n  if (nums[i] !== nums[k]) nums[++k] = nums[i];\n}\nreturn k;",
    options: ["Return k + 1; k is the last occupied index", "Initialize k to 1", "Use nums[k + 1] in the comparison", "Return nums.length - k"],
    answer: 0,
    why: "The write index is zero-based. Two unique values occupy indices 0 and 1, so the new length is k + 1."
  },
  {
    q: "For [3], target 3, this counts zero subarrays. What initialization is missing?",
    code: "const counts = new Map();\nlet sum = 0, answer = 0;\nfor (const x of nums) {\n  sum += x;\n  answer += counts.get(sum - target) || 0;\n  counts.set(sum, (counts.get(sum) || 0) + 1);\n}",
    options: ["Seed counts with prefix sum 0 occurring once", "Initialize sum to target", "Check counts after setting sum", "Sort nums first"],
    answer: 0,
    why: "A subarray from index 0 has prefix sum target; it needs the earlier prefix 0. Seed counts.set(0, 1)."
  },
  {
    q: "This counts subarrays summing to k, but fails on [1, -1, 1] with k = 1. Why?",
    code: "let left = 0, sum = 0, count = 0;\nfor (let right = 0; right < nums.length; right++) {\n  sum += nums[right];\n  while (sum > k) sum -= nums[left++];\n  if (sum === k) count++;\n}",
    options: ["Sliding-window sums are not monotonic with negative values; use prefix sums + a frequency map", "Sort nums first", "Shrink while sum < k instead", "Use a max-heap for the window"],
    answer: 0,
    why: "Removing a negative number can increase the sum, so the window cannot safely discard prefixes by comparing sum to k. Prefix sums handle negatives."
  },
  {
    q: "This keeps the k smallest frequencies instead of the k largest. Which change fixes it?",
    code: "for (const [value, freq] of counts) {\n  heap.push([freq, value]); // max-heap\n  if (heap.size > k) heap.pop();\n}",
    options: ["Use a min-heap so pop removes the smallest retained frequency", "Use a larger max-heap", "Sort values alphabetically", "Pop only when heap.size < k"],
    answer: 0,
    why: "For top k, the heap root should be the smallest of the retained candidates. A min-heap lets a larger new frequency replace that root."
  },
  {
    q: "factorial(0) overflows the stack. What base-case fix is right?",
    code: "function factorial(n) {\n  if (n === 1) return 1;\n  return n * factorial(n - 1);\n}",
    options: ["Return 1 when n <= 1", "Return 0 when n === 0", "Recurse on n + 1", "Make the base case n === 2"],
    answer: 0,
    why: "0! = 1. The recursion must stop for both 0 and 1; n <= 1 handles both."
  },
  {
    q: "[2, 10, 1] sorts as [1, 10, 2] in JavaScript. How do you get numeric order?",
    code: "nums.sort();",
    options: ["Pass (a, b) => a - b as the comparator", "Reverse the array after sorting", "Convert each number to a string first", "Use nums.sort((a, b) => b - a) for ascending order"],
    answer: 0,
    why: "JavaScript's default sort compares string representations. A numeric comparator returns a negative, zero, or positive difference."
  },
  {
    q: "This Dijkstra neighbor update can replace a shorter path with a longer one. What should it do?",
    code: "for (const [v, weight] of graph[u]) {\n  dist[v] = dist[u] + weight;\n  pq.push([dist[v], v]);\n}",
    options: ["Relax only when dist[u] + weight < dist[v]", "Always overwrite dist[v]", "Use a stack instead of a priority queue", "Mark every neighbor visited before checking its distance"],
    answer: 0,
    why: "Relaxation must improve the best-known distance. Unconditional assignment can replace a shorter path with a longer one."
  },
  {
    q: "Merging [[1, 4], [2, 3]] returns [[2, 4]], losing the first endpoint. What is the bug?",
    code: "intervals.sort((a, b) => a[1] - b[1]);\nconst out = [];\nfor (const [start, end] of intervals) {\n  const last = out[out.length - 1];\n  if (last && start <= last[1]) last[1] = Math.max(last[1], end);\n  else out.push([start, end]);\n}",
    options: ["Sort by start time, not end time", "Sort by descending start time", "Merge only when start === last[1]", "Use a stack instead of a result array"],
    answer: 0,
    why: "The sweep assumes intervals arrive in start order. Sorting by end can process [2, 3] before [1, 4], so the earlier start is lost during merge."
  }
];
