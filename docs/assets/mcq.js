// Shared multiple-choice game engine used by Spot the Pattern and Complexity
// Duel. The page provides the DOM skeleton (same element ids as the prototype)
// and calls runMcqGame({gameId, pool, roundSeconds}).
'use strict';

function runMcqGame(cfg) {
  const $ = id => document.getElementById(id);
  const ROUND_SECONDS = cfg.roundSeconds || 20;
  const daily = isDaily();
  const questions = daily ? dailyPick(cfg.pool, cfg.gameId) : shuffleInPlace([...cfg.pool]).slice(0, 10);

  let idx = 0, score = 0, streak = 0, bestStreak = 0, missed = [];
  let qStart = 0, timerId = null, locked = false;

  function start() {
    const saved = daily ? dailyProgress(cfg.gameId) : null;
    if (saved) {
      idx = saved.idx; score = saved.score; streak = saved.streak;
      bestStreak = saved.bestStreak; missed = saved.missed || [];
      times.length = 0; times.push(...(saved.times || []));
      $('startScreen').style.display = 'none';
      $('endScreen').style.display = 'none';
      $('gameScreen').style.display = 'block';
      $('scoreNum').textContent = score;
      $('streakNum').textContent = streak;
      if (idx >= questions.length) end(); else show();
      return;
    }
    idx = 0; score = 0; streak = 0; bestStreak = 0; missed = []; times.length = 0;
    $('startScreen').style.display = 'none';
    $('endScreen').style.display = 'none';
    $('gameScreen').style.display = 'block';
    show();
  }

  function show() {
    locked = false;
    const q = questions[idx];
    $('qnum').textContent = `Question ${idx + 1} of ${questions.length}${daily ? ' · Daily' : ' · Practice'}`;
    $('problem').innerHTML = cfg.render ? cfg.render(q) : q.q;
    $('feedback').className = 'feedback';
    $('nextBtn').style.display = 'none';
    const opts = $('options');
    opts.innerHTML = '';
    q.options.forEach((text, i) => {
      const b = document.createElement('button');
      b.className = 'opt'; b.textContent = text;
      b.onclick = () => answer(i, b);
      opts.appendChild(b);
    });
    timeLeft = ROUND_SECONDS;
    const fill = $('timerFill');
    fill.style.transition = 'none'; fill.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.transition = 'width 0.1s linear'; }));
    qStart = Date.now();
    clearInterval(timerId);
    timerId = setInterval(() => {
      timeLeft -= 0.1;
      const frac = Math.max(0, timeLeft / ROUND_SECONDS);
      fill.style.width = (frac * 100) + '%';
      fill.className = 'timer-fill' + (frac < 0.3 ? ' low' : '');
      if (timeLeft <= 0) { clearInterval(timerId); answer(-1, null); }
    }, 100);
  }

  let timeLeft = 0;

  function answer(choice, btn) {
    if (locked) return;
    locked = true;
    clearInterval(timerId);
    const elapsed = (Date.now() - qStart) / 1000;
    const q = questions[idx];
    const buttons = document.querySelectorAll('#options button');
    buttons.forEach(b => b.disabled = true);
    if (btn) btn.classList.add(choice === q.answer ? 'correct' : 'wrong');
    if (choice !== q.answer) buttons[q.answer].classList.add('correct');
    const correct = choice === q.answer;
    const fb = $('feedback');
    if (correct) {
      streak++; bestStreak = Math.max(bestStreak, streak);
      const speedBonus = Math.round(Math.max(0, ROUND_SECONDS - elapsed));
      const gained = 100 + streak * 20 + speedBonus;
      score += gained;
      fb.className = 'feedback show ok';
      fb.innerHTML = `✅ Correct (+${gained} — streak ×${streak}, +${speedBonus} speed bonus)<br><b>Why:</b> ${q.why}`;
    } else {
      streak = 0;
      missed.push({ q: cfg.render ? cfg.render(q) : q.q, why: q.why, answer: q.options[q.answer], timedOut: choice === -1 });
      fb.className = 'feedback show no';
      fb.innerHTML = (choice === -1 ? "⏰ Time's up." : '❌ Not quite.') + ` Answer: <b>${q.options[q.answer]}</b><br><b>Why:</b> ${q.why}`;
    }
    $('scoreNum').textContent = score;
    $('streakNum').textContent = streak;
    $('nextBtn').style.display = 'block';
    $('nextBtn').textContent = idx + 1 < questions.length ? 'Next →' : 'See results →';
    checkpoint();
  }

  function next() {
    idx++;
    if (idx < questions.length) show();
    else end();
  }

  function checkpoint() {
    // idx+1: the question just answered is consumed; resume at the next one.
    if (daily) saveDailyProgress(cfg.gameId, { idx: idx + 1, score, streak, bestStreak, missed, times: [...times] });
  }

  function end() {
    clearInterval(timerId);
    if (daily) clearDailyProgress(cfg.gameId);
    $('gameScreen').style.display = 'none';
    $('endScreen').style.display = 'block';
    const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : '0';
    $('endScore').textContent = score;
    $('endBest').textContent = bestStreak;
    $('endAvg').textContent = avg + 's';
    const dailyRes = { score, best: bestStreak };
    if (daily) {
      const prev = dailyState(cfg.gameId);
      if (prev) { prev.score = Math.max(prev.score, score); prev.best = Math.max(prev.best, bestStreak); saveDaily(cfg.gameId, prev); }
      else saveDaily(cfg.gameId, dailyRes);
    }
    store.set('dsa:' + cfg.gameId + ':last', { date: todayKey(), score });
    $('endTitle').textContent = score >= 1000 ? 'Interview-ready 🎯' : score >= 600 ? 'Solid instincts 💪' : 'Keep drilling 📚';
    $('endMsg').textContent = score >= 1000
      ? "You're recognizing problem shapes fast. Next step: implement each pattern from memory."
      : score >= 600
      ? 'Good pattern recognition on the common ones. Review the misses below.'
      : "Don't worry — pattern recognition is exactly what repetition builds. Play again and focus on the 'why' lines.";
    if (missed.length) {
      $('missedBox').style.display = 'block';
      $('missedList').innerHTML = missed.map(m => `<li>${m.q}<br><span style="color:#7ef0a8">Answer: ${m.answer} — ${m.why}</span></li>`).join('');
    } else {
      $('missedBox').style.display = 'none';
    }
  }

  const times = [];
  const origAnswer = answer;
  answer = function (c, b) { if (!locked) times.push((Date.now() - qStart) / 1000); origAnswer(c, b); };

  window.__startGame = start;
  window.__nextQuestion = next;
  return { start };
}
