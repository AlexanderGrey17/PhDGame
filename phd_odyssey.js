//import { useState, useRef, createContext, useContext } from "react";
const { useState, useRef, createContext, useContext } = React;
// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MAX_MONTHS = 72;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Journal levels: COR=low, EJOR=median, OPRE=high
const JOURNALS = {
  COR: {
    name: "Computers and Operations Research",
    reviewTime: 3,
    level: "low"
  },
  EJOR: {
    name: "European Journal of Operations Research",
    reviewTime: 5,
    level: "median"
  },
  OPRE: {
    name: "Operations Research",
    reviewTime: 6,
    level: "high"
  }
};

// Minimum RQ and WQ required to submit to each journal
const JOURNAL_REQS = {
  COR: {
    rq: 30,
    wq: 10
  },
  EJOR: {
    rq: 80,
    wq: 30
  },
  OPRE: {
    rq: 100,
    wq: 50
  }
};

// COR and EJOR simple probabilities
const ACCEPT_RATES = {
  COR: 0.80,
  EJOR: 0.45
};
const MAJOR_REVISION_RATES = {
  COR: 0.15,
  EJOR: 0.30
};

// OPRE outcome rates per revision round (index = revisionCount before this submission)
// round 0: accept 10%, major 30%, reject 60%
// round 1: accept 15%, major 35%, reject 50%
// round 2+: accept 20%, reject 80%, no further major revision
const OPRE_RATES = [{
  accept: 0.1,
  major: 0.3,
  reject: 0.6
}, {
  accept: 0.15,
  major: 0.35,
  reject: 0.50
}, {
  accept: 0.20,
  major: 0.00,
  reject: 0.80
}];

// Monthly salary and expenses
const MONTHLY_SALARY = 2000;
const MONTHLY_EXPENSES = 2000;

// Leisure activities: available by month index (0=Jan … 11=Dec)
const LEISURE_ACTIVITIES = [{
  id: "ski",
  label: "🎿 Go Skiing",
  months: [0, 1, 11],
  cost: 400,
  mhGain: 18,
  desc: "Hit the slopes! Winter fun awaits."
}, {
  id: "hike",
  label: "🥾 Go Hiking",
  months: [3, 4, 5, 8, 9],
  cost: 80,
  mhGain: 14,
  desc: "Fresh air and mountain views."
}, {
  id: "clothes",
  label: "👗 Buy New Clothes",
  months: null,
  cost: 200,
  mhGain: 8,
  desc: "Retail therapy. You deserve it."
}, {
  id: "travel_summer",
  label: "✈️ Summer Holiday",
  months: [7],
  cost: 800,
  mhGain: 30,
  desc: "Beach, sun, and no laptops."
}, {
  id: "travel_xmas",
  label: "🎄 Christmas Holiday",
  months: [11],
  cost: 600,
  mhGain: 28,
  desc: "Home for the holidays. Finally."
}, {
  id: "dinner",
  label: "🍽️ Nice Restaurant",
  months: null,
  cost: 120,
  mhGain: 10,
  desc: "Treat yourself to a proper meal."
}, {
  id: "fencing",
  label: "🤺 Go Fencing",
  months: null,
  cost: 150,
  mhGain: 15,
  desc: "An elegant sport. En garde!"
}];

// INFORMS conference calendar
const INFORMS_SUBMIT_START = 2; // March  (0-indexed)
const INFORMS_SUBMIT_END = 5; // June
const INFORMS_ANNOUNCE = 7; // August
const INFORMS_CONFERENCE = 9; // October

const RANDOM_EVENTS = [{
  id: "advisor_meeting",
  title: "Advisor Check-in",
  category: "Academic",
  description: "Your advisor requests an urgent progress meeting.",
  options: [{
    text: "Show results honestly",
    effects: {
      mentalHealth: -5,
      advisorRelation: +10,
      domainKnowledge: +5
    },
    consequence: "Honest feedback. Advisor is supportive."
  }, {
    text: "Polish results first",
    effects: {
      mentalHealth: -10,
      advisorRelation: +5
    },
    consequence: "Meeting goes well but you're exhausted."
  }, {
    text: "Ask to postpone",
    effects: {
      advisorRelation: -10,
      mentalHealth: +5
    },
    consequence: "Advisor is slightly annoyed but agrees."
  }]
}, {
  id: "lab_drama",
  title: "Lab Conflict",
  category: "School",
  description: "A labmate accuses you of stealing their research idea.",
  options: [{
    text: "Confront diplomatically",
    effects: {
      mentalHealth: -10,
      academicReputation: +5
    },
    consequence: "Tension eases. Mutual respect grows."
  }, {
    text: "Ignore, focus on work",
    effects: {
      mentalHealth: -15
    },
    consequence: "The drama festers but you keep working."
  }, {
    text: "Involve your advisor",
    effects: {
      advisorRelation: -10,
      mentalHealth: -10,
      academicReputation: -5
    },
    consequence: "Advisor mediates. Awkward but resolved."
  }]
}, {
  id: "seminar",
  title: "Distinguished Speaker Seminar",
  category: "Academic",
  description: "A Nobel laureate is giving a talk on your research area.",
  options: [{
    text: "Attend and take notes",
    effects: {
      domainKnowledge: +10,
      mentalHealth: +5
    },
    consequence: "Inspiring. You have a new idea brewing."
  }, {
    text: "Skip to work on research",
    effects: {
      domainKnowledge: +2
    },
    consequence: "Progress made. Was it worth missing?"
  }]
}, {
  id: "personal_crisis",
  title: "Family Emergency",
  category: "Personal",
  description: "A family member falls ill. You feel torn between duty and deadlines.",
  options: [{
    text: "Go home and support family",
    effects: {
      mentalHealth: +10,
      advisorRelation: -5,
      money: -600
    },
    consequence: "Family first. Research can wait."
  }, {
    text: "Stay and send support remotely",
    effects: {
      mentalHealth: -15
    },
    consequence: "Guilt lingers. Hard to focus."
  }]
}, {
  id: "paper_review",
  title: "Invited to Review a Paper",
  category: "Academic",
  description: "A journal asks you to peer-review a submission in your area.",
  options: [{
    text: "Accept and review thoroughly",
    effects: {
      domainKnowledge: +8,
      mentalHealth: -5,
      academicReputation: +5
    },
    consequence: "Great learning experience."
  }, {
    text: "Decline politely",
    effects: {
      mentalHealth: +5
    },
    consequence: "Protected your time."
  }]
}, {
  id: "new_method",
  title: "Methodological Breakthrough",
  category: "Academic",
  description: "You discover a paper describing a technique perfectly suited to your research.",
  options: [{
    text: "Deep-dive into the technique",
    effects: {
      domainKnowledge: +15,
      mentalHealth: -5
    },
    consequence: "Your understanding deepens significantly."
  }, {
    text: "Skim it and move on",
    effects: {
      domainKnowledge: +5
    },
    consequence: "Noted for later."
  }]
}, {
  id: "social_life",
  title: "PhD Social Event",
  category: "Personal",
  description: "Your department is hosting a game night. Everyone needs a break.",
  options: [{
    text: "Join and have fun",
    effects: {
      mentalHealth: +15,
      academicReputation: +3
    },
    consequence: "You laugh for the first time in weeks."
  }, {
    text: "Stay in the lab",
    effects: {
      mentalHealth: -5
    },
    consequence: "Productive but lonely."
  }]
}, {
  id: "teaching",
  title: "TA Assignment",
  category: "School",
  description: "You're assigned to TA an undergraduate course this semester.",
  options: [{
    text: "Accept the TA position",
    effects: {
      mentalHealth: -10,
      academicReputation: +8,
      money: +1000
    },
    consequence: "Students appreciate your teaching. It pays well too.",
    setTA: true
  }, {
    text: "Decline the assignment",
    effects: {},
    consequence: "You keep your schedule clear for research."
  }]
}, {
  id: "code_bug",
  title: "Critical Code Bug Found",
  category: "Academic",
  description: "A major bug in your simulation code invalidates months of results.",
  options: [{
    text: "Debug and rerun everything",
    effects: {
      mentalHealth: -20,
      domainKnowledge: +5
    },
    consequence: "Painful but necessary. Results are now correct."
  }, {
    text: "Hope reviewers don't notice",
    effects: {
      mentalHealth: -10,
      academicReputation: -10
    },
    consequence: "A risky gamble. Stress never leaves."
  }]
}, {
  id: "unexpected_bill",
  title: "Unexpected Expense",
  category: "Personal",
  description: "Your laptop breaks down. You need to pay for urgent repairs.",
  options: [{
    text: "Pay for repairs ($500)",
    effects: {
      money: -500
    },
    consequence: "Fixed. Back to work."
  }, {
    text: "Borrow a lab computer temporarily",
    effects: {
      mentalHealth: -8,
      domainKnowledge: +3
    },
    consequence: "Inconvenient but manageable."
  }]
}, {
  id: "admin_work",
  title: "Administrative Request",
  category: "School",
  description: "Your advisor asks you to help organize the department's upcoming workshop — reviewing submissions, preparing schedules, and coordinating logistics.",
  options: [{
    text: "Help out with the workshop",
    effects: {
      mentalHealth: -12,
      advisorRelation: +15
    },
    consequence: "Your advisor is grateful. Your relationship grows stronger."
  }, {
    text: "Apologize and decline",
    effects: {
      advisorRelation: -8
    },
    consequence: "Your advisor is slightly disappointed but understands."
  }]
}];

// NSF Fellowship calendar
const NSF_APPLY_MONTH = 9; // October (0-indexed) — player spends this month to apply
const NSF_ANNOUNCE_MONTH = 4; // May — result announced

// Comprehensive exam: game months (Sep Y1 = month 1)
// Jul Y2 = game month 11, Nov Y2 = game month 15
const COMP_EXAM_MONTH_1 = 11; // July of Year 2
const COMP_EXAM_MONTH_2 = 15; // November of Year 2
const COMP_EXAM_BASE_CHANCE = 0.20;
const COMP_EXAM_STUDY_BONUS = 0.175; // 4 studies → 0.20+4*0.175 = 0.90

// Advisor Year-3 performance review: last month of Year 3
// Sep Y1=month 1 → Sep Y3=month 25, Aug Y3=month 24, so last of Y3 = month 36 (Aug Y4? no)
// Y3 runs months 25-36 (Sep Y3–Aug Y4). Last month of calendar Year 3 = month 36.
const ADVISOR_Y3_REVIEW_MONTH = 36;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
// PhD starts in September (index 8). Game month 1 = Sep Y1, month 5 = Jan Y2, etc.
const START_MONTH_OFFSET = 8; // September = index 8
const calMonIdx = gameMonth => (START_MONTH_OFFSET + gameMonth - 1) % 12;
const calYear = gameMonth => 1 + Math.floor((START_MONTH_OFFSET + gameMonth - 1) / 12);
const monthIdx = calMonIdx; // alias used throughout

// Publication score: weights OPRE heavily, used for scholarship/NSF chances
function pubScore(s) {
  return s.pubHigh * 10 + s.pubMedian * 4 + s.pubLow * 1;
}

// Chance of winning NSF fellowship (0–0.75), scales with pub score
function nsfChance(s) {
  const score = pubScore(s);
  // score 0→5%, 5→25%, 10→50%, 20→75%
  return Math.min(0.05 + score / 20 * 0.70, 0.75);
}

// Determine which journals a paper qualifies for based on rq and wq
function eligibleJournals(paper) {
  return Object.keys(JOURNALS).filter(j => {
    const req = JOURNAL_REQS[j];
    return (paper.rq || 0) >= req.rq && (paper.wq || 0) >= req.wq;
  });
}
function acceptOutcome(journal, revisionCount) {
  const r = Math.random();
  if (journal === "OPRE") {
    const round = Math.min(revisionCount, 2);
    const rates = OPRE_RATES[round];
    if (r < rates.accept) return "accept";
    if (r < rates.accept + rates.major) return "major_revision";
    return "reject";
  }
  // COR / EJOR
  const acc = ACCEPT_RATES[journal] ?? 0.50;
  const major = MAJOR_REVISION_RATES[journal] ?? 0.20;
  if (r < acc) return "accept";
  if (r < acc + major) return "major_revision";
  return "reject";
}
function randEvent() {
  return RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
}
function canGraduate(s) {
  return s.submittedCount >= 3 && s.pubLow + s.pubMedian + s.pubHigh >= 1;
}

// A project is "done" (not blocking new project) once it has a non-rejected paper OR is in writing stage
function hasActiveWork(s) {
  if (!s.activeProject) return false;
  const proj = s.projects.find(p => p.id === s.activeProject);
  if (!proj) return false;
  // Active project is unsolved → still working on it
  if (!proj.solved) return true;
  // Solved but no paper started yet → still blocking
  const papers = s.papers.filter(p => p.projectId === proj.id);
  if (papers.length === 0) return true;
  // Has a paper that is not rejected → not blocking
  return papers.every(p => p.status === "rejected");
}
function writableProjects(s) {
  return s.projects.filter(proj => {
    if (!proj.solved) return false;
    const rel = s.papers.filter(p => p.projectId === proj.id);
    return rel.length === 0 || rel.every(p => p.status === "rejected");
  });
}
function actionablePapers(s) {
  return s.papers.filter(p => ["advisor_approved", "rejected", "major_revision"].includes(p.status));
}
function availableLeisure(monthNumber) {
  const mi = monthIdx(monthNumber);
  return LEISURE_ACTIVITIES.filter(a => a.months === null || a.months.includes(mi));
}

// ─── TICK ─────────────────────────────────────────────────────────────────────

function tickMonth(s) {
  let ns = {
    ...s,
    papers: s.papers.map(p => ({
      ...p,
      rejectedFrom: [...(p.rejectedFrom || [])]
    })),
    journalReviews: s.journalReviews.map(r => ({
      ...r
    })),
    pendingLetters: [] // reset — letters get consumed by the modal, freshly generated each tick
  };

  // ── Salary – expenses ──
  const salaryIn = MONTHLY_SALARY;
  const rentOut = MONTHLY_EXPENSES;
  ns.money = (ns.money || 0) + salaryIn - rentOut;
  // Always queue a finance summary letter each month
  ns.pendingLetters = [{
    type: "finance_summary",
    salary: salaryIn,
    expenses: rentOut,
    balance: ns.money,
    nsfBonus: 0,
    extraItems: [...(ns.monthSpending || [])] // leisure + event spending from previous action
  }];
  ns.monthSpending = []; // reset for next month
  // ── Advance month ──
  ns.month += 1;
  if (ns.month > MAX_MONTHS) return {
    state: {
      ...ns,
      phase: "gameOver",
      gameOverReason: "timeout"
    },
    signal: "gameOver"
  };

  // ── Bankruptcy check ──
  if (ns.money < 0) return {
    state: {
      ...ns,
      phase: "gameOver",
      gameOverReason: "bankrupt"
    },
    signal: "gameOver"
  };
  const mi = monthIdx(ns.month);

  // ── Idea decay: 10% chance an idea is scooped ──
  if (ns.ideas > 0 && Math.random() < 0.10) {
    ns.ideas -= 1;
    ns.log = [`💔 An idea was scooped — someone just published it! (Ideas: ${ns.ideas})`, ...ns.log];
  }

  // ── Mental health collapse ──
  if (ns.mentalHealth <= 0) {
    return {
      state: {
        ...ns,
        phase: "gameOver",
        gameOverReason: "mentalHealth"
      },
      signal: "gameOver"
    };
  }

  // ── Advisor expulsion ──
  if (ns.advisorRelation <= 0) {
    return {
      state: {
        ...ns,
        phase: "gameOver",
        gameOverReason: "advisorKick"
      },
      signal: "gameOver"
    };
  }

  // ── NSF announcement (May) ──
  if (mi === NSF_ANNOUNCE_MONTH && ns.nsfApplied) {
    const chance = nsfChance(ns);
    const awarded = Math.random() < chance;
    ns.nsfApplied = false;
    if (awarded) {
      ns.money += 10000;
      ns.nsfEverWon = true;
      ns.mentalHealth = clamp(ns.mentalHealth + 20);
      ns.monthSpending = [...(ns.monthSpending || []), {
        label: "🏅 NSF Fellowship (one-time award)",
        amount: 10000
      }];
      ns.pendingLetters = [...ns.pendingLetters, {
        type: "nsf_award",
        month: ns.month
      }];
      ns.log = [`🏆 NSF Fellowship AWARDED! +$10,000 one-time. +20 mood.`, ...ns.log];
    } else {
      ns.mentalHealth = clamp(ns.mentalHealth - 10);
      ns.pendingLetters = [...ns.pendingLetters, {
        type: "nsf_reject",
        month: ns.month
      }];
      ns.log = [`😔 NSF Fellowship not awarded this cycle. -10 mood.`, ...ns.log];
    }
  }

  // ── INFORMS announcement (August) ──
  if (mi === INFORMS_ANNOUNCE && ns.informsApplied && !ns.informsAccepted) {
    const accepted = Math.random() < 0.65;
    ns.informsAccepted = accepted;
    if (accepted) {
      ns.log = [`🏆 INFORMS abstract ACCEPTED! Conference is in October.`, ...ns.log];
    } else {
      ns.informsApplied = false;
      ns.informsAccepted = false;
      ns.log = [`😔 INFORMS abstract not accepted this year.`, ...ns.log];
    }
  }

  // ── INFORMS conference (October) ──
  if (mi === INFORMS_CONFERENCE && ns.informsAccepted) {
    ns.mentalHealth = clamp(ns.mentalHealth + 15);
    ns.academicReputation = clamp(ns.academicReputation + 8);
    ns.advisorRelation = clamp(ns.advisorRelation + 5);
    const gotIdea = Math.random() < 0.40;
    if (gotIdea) ns.ideas += 1;
    ns.pendingLetters = [...ns.pendingLetters, {
      type: "informs_attend",
      gotIdea,
      month: ns.month
    }];
    ns.log = [`🎉 Attended INFORMS! Networking +morale +reputation.${gotIdea ? " 💡 New idea!" : ""}`, ...ns.log];
    ns.informsApplied = false;
    ns.informsAccepted = false;
  }

  // ── Comprehensive Exam ──
  if (!ns.compExamPassed) {
    if (ns.month === COMP_EXAM_MONTH_1 || ns.month === COMP_EXAM_MONTH_2) {
      const chance = Math.min(COMP_EXAM_BASE_CHANCE + ns.compExamStudySessions * COMP_EXAM_STUDY_BONUS, 0.97);
      const passed = Math.random() < chance;
      ns.compExamAttempts = (ns.compExamAttempts || 0) + 1;
      if (passed) {
        ns.compExamPassed = true;
        ns.domainKnowledge = clamp(ns.domainKnowledge + 10);
        ns.academicReputation = clamp(ns.academicReputation + 8);
        ns.pendingLetters = [...ns.pendingLetters, {
          type: "comp_exam",
          passed: true,
          attempt: ns.compExamAttempts,
          chance: Math.round(chance * 100),
          month: ns.month
        }];
        ns.log = [`🎉 PASSED Comprehensive Exam (attempt ${ns.compExamAttempts})! +knowledge +reputation.`, ...ns.log];
      } else {
        if (ns.compExamAttempts >= 2) {
          // Failed both attempts → expelled
          return {
            state: {
              ...ns,
              phase: "gameOver",
              gameOverReason: "compExamFail"
            },
            signal: "gameOver"
          };
        }
        ns.pendingLetters = [...ns.pendingLetters, {
          type: "comp_exam",
          passed: false,
          attempt: ns.compExamAttempts,
          chance: Math.round(chance * 100),
          month: ns.month
        }];
        ns.log = [`❌ FAILED Comprehensive Exam (attempt ${ns.compExamAttempts}). ${ns.compExamAttempts === 1 ? "One more chance in November." : "Expelled."}`, ...ns.log];
      }
    }
  }

  // ── Journal reviews ──
  const done = [],
    keep = [];
  ns.journalReviews.forEach(r => {
    const nr = {
      ...r,
      monthsLeft: r.monthsLeft - 1
    };
    (nr.monthsLeft <= 0 ? done : keep).push(nr);
  });
  ns.journalReviews = keep;
  done.forEach(rev => {
    const idx = ns.papers.findIndex(p => p.id === rev.paperId);
    if (idx === -1) return;
    const p = {
      ...ns.papers[idx]
    };
    const outcome = acceptOutcome(rev.journal, rev.revisionCount || 0);
    if (outcome === "accept") {
      p.status = "accepted";
      p.journal = rev.journal;
      const jLevel = JOURNALS[rev.journal].level;
      if (jLevel === "high") ns.pubHigh++;else if (jLevel === "median") ns.pubMedian++;else ns.pubLow++;
      // Boost mood & reputation on acceptance
      if (rev.journal === "OPRE") {
        ns.mentalHealth = clamp(ns.mentalHealth + 100);
        ns.academicReputation = clamp(ns.academicReputation + 100);
        ns.advisorRelation = clamp(ns.advisorRelation + 100);
      } else {
        const mhBoost = rev.journal === "EJOR" ? 12 : 6;
        const repBoost = rev.journal === "EJOR" ? 8 : 4;
        ns.mentalHealth = clamp(ns.mentalHealth + 10 + mhBoost);
        ns.academicReputation = clamp(ns.academicReputation + repBoost);
        ns.advisorRelation = clamp(ns.advisorRelation + 5);
      }
      // Queue a decision letter
      ns.pendingLetters = [...ns.pendingLetters, {
        type: "paper_decision",
        outcome: "accept",
        paperId: p.id,
        journal: rev.journal,
        month: ns.month
      }];
      ns.log = [`🎉 "${p.id}" ACCEPTED in ${rev.journal}! +mood +reputation`, ...ns.log];
    } else if (outcome === "major_revision") {
      p.status = "major_revision";
      p.revisionCount = (p.revisionCount || 0) + 1;
      p.pendingJournal = rev.journal;
      ns.pendingLetters = [...ns.pendingLetters, {
        type: "paper_decision",
        outcome: "major_revision",
        paperId: p.id,
        journal: rev.journal,
        month: ns.month,
        revisionRound: p.revisionCount
      }];
      ns.log = [`📝 "${p.id}" MAJOR REVISION requested by ${rev.journal} (round ${p.revisionCount}).`, ...ns.log];
    } else {
      p.status = "rejected";
      p.rejectedFrom = [...(p.rejectedFrom || []), rev.journal];
      // Mood and advisor penalty on rejection
      ns.mentalHealth = clamp(ns.mentalHealth - 10);
      ns.advisorRelation = clamp(ns.advisorRelation - 5);
      ns.pendingLetters = [...ns.pendingLetters, {
        type: "paper_decision",
        outcome: "reject",
        paperId: p.id,
        journal: rev.journal,
        month: ns.month
      }];
      ns.log = [`❌ "${p.id}" REJECTED from ${rev.journal}. -10 mood, -5 advisor relation.`, ...ns.log];
    }
    ns.papers[idx] = p;
  });

  // ── Advisor review ──
  if (ns.pendingAdvisorReview) {
    ns.pendingAdvisorReview = {
      ...ns.pendingAdvisorReview,
      monthsLeft: ns.pendingAdvisorReview.monthsLeft - 1
    };
    if (ns.pendingAdvisorReview.monthsLeft <= 0) {
      const idx = ns.papers.findIndex(p => p.id === ns.pendingAdvisorReview.paperId);
      if (idx !== -1) {
        const p = {
          ...ns.papers[idx]
        };
        // Suggest highest journal the paper qualifies for
        const elig = eligibleJournals(p);
        const suggestions = ["OPRE", "EJOR", "COR"];
        p.advisorLevel = suggestions.find(j => elig.includes(j)) || "COR";
        p.status = "advisor_approved";
        ns.papers[idx] = p;
        ns.log = [`👨‍🏫 Advisor reviewed "${p.id}". Suggested: ${p.advisorLevel} (RQ:${p.rq} WQ:${p.wq}).`, ...ns.log];
      }
      ns.pendingAdvisorReview = null;
    }
  }

  // ── Thesis ──
  if (ns.thesisStarted && !ns.thesisComplete) {
    ns.thesisProgress = Math.min(ns.thesisProgress + 34, 100);
    if (ns.thesisProgress >= 100) {
      ns.thesisComplete = true;
      ns.phase = "career";
      ns.log = [`🎓 Thesis complete! Time to choose your career.`, ...ns.log];
      return {
        state: ns,
        signal: "career"
      };
    }
  }
  ns.canWriteThesis = canGraduate(ns);
  // Reset TA flag each month
  ns.taDoneThisMonth = false;

  // ── Advisor Year-3 performance review ──
  if (ns.month === ADVISOR_Y3_REVIEW_MONTH && !ns.advisorY3ReviewDone) {
    ns.advisorY3ReviewDone = true;
    const hasPub = ns.pubLow + ns.pubMedian + ns.pubHigh >= 1;
    const hasAnyPaper = ns.papers.length > 0;
    if (hasPub) {
      // Satisfied
      ns.advisorRelation = clamp(ns.advisorRelation + 10);
      ns.academicReputation = clamp(ns.academicReputation + 5);
      ns.pendingLetters = [...ns.pendingLetters, {
        type: "advisor_y3_review",
        verdict: "satisfied"
      }];
      ns.log = [`👨‍🏫 Year-3 Review: Advisor is satisfied — you have a publication!`, ...ns.log];
    } else if (hasAnyPaper) {
      // Upset — has papers but none published
      ns.advisorRelation = clamp(ns.advisorRelation - 20);
      ns.pendingLetters = [...ns.pendingLetters, {
        type: "advisor_y3_review",
        verdict: "upset"
      }];
      ns.log = [`😟 Year-3 Review: Advisor is upset — no publications yet.`, ...ns.log];
    } else {
      // Very upset — not even writing
      ns.advisorRelation = clamp(ns.advisorRelation - 35);
      ns.pendingLetters = [...ns.pendingLetters, {
        type: "advisor_y3_review",
        verdict: "very_upset"
      }];
      ns.log = [`😡 Year-3 Review: Advisor is very upset — you haven't even started writing!`, ...ns.log];
    }
  }
  ns.currentEvent = randEvent();
  // If there are pending letters, show them before the event
  ns.phase = ns.pendingLetters.length > 0 ? "letters" : "event";
  ns.log = ns.log.slice(0, 80);
  return {
    state: ns,
    signal: null
  };
}

// ─── INITIAL STATE ────────────────────────────────────────────────────────────

function initialState() {
  return {
    month: 1,
    phase: "welcome",
    // starts with welcome panel, not event
    mentalHealth: 80,
    domainKnowledge: 30,
    academicReputation: 10,
    advisorRelation: 50,
    money: 2000,
    ideas: 1,
    // advisor gives 1 idea at start
    projects: [],
    activeProject: null,
    papers: [],
    writingPaperId: null,
    submittedCount: 0,
    pubLow: 0,
    pubMedian: 0,
    pubHigh: 0,
    thesisStarted: false,
    thesisProgress: 0,
    thesisComplete: false,
    canWriteThesis: false,
    pendingAdvisorReview: null,
    journalReviews: [],
    informsApplied: false,
    informsAccepted: false,
    nsfApplied: false,
    // applied in October for NSF fellowship
    nsfBonus: 0,
    // unused (NSF is now a one-time award)
    nsfEverWon: false,
    // once won, can never apply again
    pendingLetters: [],
    monthSpending: [],
    compExamPassed: false,
    // comprehensive exam passed
    compExamAttempts: 0,
    // 0, 1, or 2 attempts used
    compExamStudySessions: 0,
    // how many months spent studying for comp exam
    taDoneThisMonth: false,
    // TA taken this month → research blocked
    advisorY3ReviewDone: false,
    // year-3 performance review triggered once
    currentEvent: randEvent(),
    log: ["📬 Month 1: You've accepted your PhD offer in Operations Research. Good luck!"]
  };
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const LIGHT = {
  bg: "#f5f1eb",
  surface: "#ffffff",
  surfaceAlt: "#faf8f5",
  inset: "rgba(255,255,255,0.50)",
  border: "#e5dfd5",
  text: "#2a2535",
  sub: "#6b6075",
  muted: "#a89eb0",
  accent: "#6c5ce7",
  accentSoft: "#eeebfc",
  green: "#00897b",
  greenSoft: "#e0f4f1",
  red: "#e53935",
  redSoft: "#fdecea",
  amber: "#c67c00",
  amberSoft: "#fdf3e0",
  blue: "#1565c0",
  blueSoft: "#e3edf9",
  rose: "#c2185b",
  roseSoft: "#fde8f1",
  teal: "#00838f",
  tealSoft: "#e0f7fa"
};
const DARK = {
  bg: "#12111a",
  surface: "#1e1c2a",
  surfaceAlt: "#252336",
  inset: "rgba(0,0,0,0.50)",
  border: "#332f4a",
  text: "#e8e4f0",
  sub: "#9b94b0",
  muted: "#5e5878",
  accent: "#a78bfa",
  accentSoft: "#2a2350",
  green: "#34d399",
  greenSoft: "#0d2e26",
  red: "#f87171",
  redSoft: "#2e1414",
  amber: "#fbbf24",
  amberSoft: "#2e2208",
  blue: "#60a5fa",
  blueSoft: "#0d1f3c",
  rose: "#f472b6",
  roseSoft: "#2e1124",
  teal: "#2dd4bf",
  tealSoft: "#0d2928"
};
const ThemeCtx = /*#__PURE__*/createContext(LIGHT);
const useC = () => useContext(ThemeCtx);
const makeGlobalStyles = C => `
  @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:${C.bg}; font-family:'DM Mono',monospace; }
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:${C.bg}}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn  { from{opacity:0;transform:scale(.95)}       to{opacity:1;transform:scale(1)}      }
  @keyframes confettiFall {
    0%   { transform:translateY(-10px) rotate(0deg);   opacity:1; }
    100% { transform:translateY(340px) rotate(720deg); opacity:0; }
  }
  @keyframes ideaPop {
    0%   { opacity:0; transform:scale(.7) translateY(10px); }
    60%  { opacity:1; transform:scale(1.05) translateY(-4px); }
    100% { opacity:1; transform:scale(1) translateY(0); }
  }
`;

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────

function StatBar({
  label,
  value,
  color
}) {
  const C = useC();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 10,
      marginBottom: 2,
      color: C.sub
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color,
      fontWeight: 600
    }
  }, Math.round(value))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      background: C.border,
      borderRadius: 3,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${clamp(value)}%`,
      height: "100%",
      background: color,
      borderRadius: 3,
      transition: "width .5s"
    }
  })));
}
function Pill({
  children,
  color,
  bg,
  small
}) {
  const C = useC();
  return /*#__PURE__*/React.createElement("span", {
    style: {
      background: bg || C.accentSoft,
      color: color || C.accent,
      borderRadius: 4,
      padding: small ? "1px 6px" : "2px 8px",
      fontSize: small ? 10 : 11,
      fontWeight: 600,
      display: "inline-block"
    }
  }, children);
}
function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  small,
  full
}) {
  const C = useC();
  const styles = {
    primary: {
      bg: C.accent,
      text: "#fff",
      hov: "#5a4dd6"
    },
    success: {
      bg: C.green,
      text: "#fff",
      hov: "#00796b"
    },
    danger: {
      bg: C.red,
      text: "#fff",
      hov: "#c62828"
    },
    neutral: {
      bg: C.surfaceAlt,
      text: C.text,
      hov: C.border,
      border: `1px solid ${C.border}`
    },
    ghost: {
      bg: "transparent",
      text: C.accent,
      hov: C.accentSoft,
      border: `1.5px solid ${C.accent}`
    },
    amber: {
      bg: C.amber,
      text: "#fff",
      hov: "#a66500"
    },
    teal: {
      bg: C.teal,
      text: "#fff",
      hov: "#006064"
    }
  }[variant] || {};
  const [hov, setHov] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      background: disabled ? C.border : hov ? styles.hov : styles.bg,
      color: disabled ? C.muted : styles.text,
      border: styles.border || "none",
      borderRadius: 8,
      padding: small ? "5px 12px" : "9px 18px",
      fontSize: small ? 11 : 12,
      fontFamily: "'DM Mono',monospace",
      fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .55 : 1,
      transition: "background .15s",
      width: full ? "100%" : undefined,
      letterSpacing: ".3px",
      marginRight: 6,
      marginBottom: 6
    }
  }, children);
}
function Card({
  children,
  style,
  onClick
}) {
  const C = useC();
  const [hov, setHov] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => onClick && setHov(true),
    onMouseLeave: () => onClick && setHov(false),
    style: {
      background: C.surface,
      border: `1px solid ${hov && onClick ? C.accent : C.border}`,
      borderRadius: 12,
      padding: "16px 18px",
      marginBottom: 12,
      cursor: onClick ? "pointer" : "default",
      transition: "border-color .15s",
      animation: "fadeIn .25s ease",
      ...style
    }
  }, children);
}
function SectionLabel({
  children,
  color
}) {
  const C = useC();
  const col = color || C.accent;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: col,
      fontWeight: 600,
      letterSpacing: 2,
      marginBottom: 12,
      textTransform: "uppercase"
    }
  }, children);
}

// ─── CONFETTI ─────────────────────────────────────────────────────────────────

function Confetti() {
  const C = useC();
  const pieces = Array.from({
    length: 48
  }, (_, i) => ({
    id: i,
    color: ["#6c5ce7", "#00897b", "#c67c00", "#e53935", "#c2185b", "#1565c0", "#f9ca24", "#f0932b"][i % 8],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.2}s`,
    duration: `${1.4 + Math.random() * 0.8}s`,
    size: `${6 + Math.random() * 8}px`,
    shape: i % 3 === 0 ? "circle" : i % 3 === 1 ? "50% 0 0 50% / 50% 0 0 50%" : "0"
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 10
    }
  }, pieces.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      position: "absolute",
      top: 0,
      left: p.left,
      width: p.size,
      height: p.size,
      background: p.color,
      borderRadius: p.shape,
      animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`
    }
  })));
}

// ─── IDEA POPUP ───────────────────────────────────────────────────────────────

function IdeaPopup({
  onDismiss
}) {
  const C = useC();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      animation: "fadeIn .2s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.surface,
      borderRadius: 20,
      padding: "40px 44px",
      maxWidth: 380,
      textAlign: "center",
      position: "relative",
      border: `2px solid ${C.amber}`,
      animation: "ideaPop .4s ease",
      boxShadow: "0 24px 48px rgba(0,0,0,.18)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 52,
      marginBottom: 12
    }
  }, "\uD83D\uDCA1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 22,
      fontWeight: 700,
      color: C.amber,
      marginBottom: 10
    }
  }, "New Research Idea!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.sub,
      lineHeight: 1.8,
      marginBottom: 24
    }
  }, "While reading through the literature, a spark of inspiration struck. You've identified a promising new research direction to explore."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.amberSoft,
      borderRadius: 10,
      padding: "10px 16px",
      fontSize: 13,
      fontWeight: 600,
      color: C.amber,
      marginBottom: 24
    }
  }, "\uD83D\uDCA1 +1 Idea added to your idea bank"), /*#__PURE__*/React.createElement(Btn, {
    onClick: onDismiss,
    variant: "amber"
  }, "Got it \u2014 let's keep going!")));
}

// ─── BREAKTHROUGH POPUP ───────────────────────────────────────────────────────

function BreakthroughPopup({
  projectId,
  rq,
  onDismiss
}) {
  const C = useC();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      animation: "fadeIn .2s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.surface,
      borderRadius: 20,
      padding: "40px 44px",
      maxWidth: 420,
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
      border: `2px solid ${C.green}`,
      animation: "ideaPop .4s ease",
      boxShadow: "0 24px 48px rgba(0,0,0,.2)"
    }
  }, /*#__PURE__*/React.createElement(Confetti, null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 52,
      marginBottom: 12
    }
  }, "\uD83C\uDFAF"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 22,
      fontWeight: 700,
      color: C.green,
      marginBottom: 10
    }
  }, "Problem Solved!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.sub,
      lineHeight: 1.8,
      marginBottom: 20
    }
  }, "After months of focused research, you've cracked it.", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: C.text
    }
  }, " ", projectId), " is now solved and ready to be written up into a publication."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.blueSoft,
      borderRadius: 10,
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.blue,
      fontWeight: 600,
      letterSpacing: 1,
      marginBottom: 4
    }
  }, "RESEARCH QUALITY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: C.blue,
      fontFamily: "'Lora',serif"
    }
  }, rq), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.sub,
      marginTop: 2
    }
  }, "locked in as RQ")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.greenSoft,
      borderRadius: 10,
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.green,
      fontWeight: 600,
      letterSpacing: 1,
      marginBottom: 4
    }
  }, "NEXT STEP"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: C.green,
      marginTop: 6
    }
  }, "\u270D\uFE0F Write Paper"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.sub,
      marginTop: 4
    }
  }, "Build WQ through writing"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.amberSoft,
      borderRadius: 10,
      padding: "10px 16px",
      fontSize: 12,
      color: C.amber,
      fontWeight: 600,
      marginBottom: 24,
      lineHeight: 1.6
    }
  }, "\u26A0\uFE0F Domain knowledge has been consumed into this breakthrough and reset to 0."), /*#__PURE__*/React.createElement(Btn, {
    onClick: onDismiss,
    variant: "success"
  }, "Let's write it up \u2192")));
}
function ChoiceCard({
  onClick,
  children,
  highlight,
  disabled,
  color
}) {
  const C = useC();
  const [hov, setHov] = useState(false);
  const bc = disabled ? C.border : color || (highlight ? C.accent : hov ? C.accent : C.border);
  return /*#__PURE__*/React.createElement("button", {
    onClick: disabled ? undefined : onClick,
    onMouseEnter: () => !disabled && setHov(true),
    onMouseLeave: () => !disabled && setHov(false),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      background: disabled ? C.surfaceAlt : highlight || hov ? color ? color + "18" : C.accentSoft : C.surface,
      border: `1.5px solid ${bc}`,
      borderRadius: 10,
      padding: "12px 14px",
      fontFamily: "'DM Mono',monospace",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .5 : 1,
      transition: "border-color .15s, background .15s",
      marginBottom: 8
    }
  }, children);
}

// ─── WELCOME PANEL ───────────────────────────────────────────────────────────

function WelcomePanel({
  onStart
}) {
  const C = useC();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeIn .4s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: `linear-gradient(135deg, ${C.accentSoft} 0%, ${C.blueSoft} 100%)`,
      border: `1px solid ${C.accent}44`,
      borderRadius: 16,
      padding: "32px 36px",
      marginBottom: 20,
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(Confetti, null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      marginBottom: 16,
      textAlign: "center"
    }
  }, "\uD83C\uDF93"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 22,
      fontWeight: 700,
      color: C.text,
      textAlign: "center",
      marginBottom: 6
    }
  }, "PhD Offer Accepted"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.muted,
      letterSpacing: 3,
      textAlign: "center",
      marginBottom: 24
    }
  }, "OPERATIONS RESEARCH \xB7 YEAR 1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.text,
      lineHeight: 1.9,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: 10
    }
  }, "Congratulations! You have accepted your doctoral offer at the Department of Operations Research. Your journey to a PhD begins today."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: 10
    }
  }, "Your advisor has warmly welcomed you and shared one promising research idea to get you started. Make it count."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: 10
    }
  }, "Your monthly PhD stipend is ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: C.green
    }
  }, "$2,000"), ", which exactly covers your apartment rent and living expenses of ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: C.red
    }
  }, "$2,000/month"), ". Money is tight \u2014 watch for scholarship opportunities."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.amber,
      fontWeight: 600
    }
  }, "You have 6 years (72 months) to complete your thesis and graduate. Good luck.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 10,
      background: C.inset,
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 20
    }
  }, [{
    label: "Mood",
    val: "80",
    color: C.green
  }, {
    label: "Domain Know.",
    val: "30",
    color: C.blue
  }, {
    label: "Ideas",
    val: "1 💡",
    color: C.amber
  }, {
    label: "Starting Money",
    val: "$2,000",
    color: C.green
  }].map(item => /*#__PURE__*/React.createElement("div", {
    key: item.label,
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: item.color
    }
  }, item.val), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: C.muted,
      marginTop: 2,
      letterSpacing: 1
    }
  }, item.label.toUpperCase()))))), /*#__PURE__*/React.createElement(Btn, {
    onClick: onStart,
    variant: "primary",
    full: true
  }, "Begin PhD Journey \u2192"));
}

// ─── DECISION LETTERS PANEL ──────────────────────────────────────────────────
// Shown when tickMonth generates pendingLetters — player reads and dismisses

function LettersPanel({
  s,
  onDismiss
}) {
  const C = useC();
  const [idx, setIdx] = useState(0);
  const letters = s.pendingLetters || [];
  if (letters.length === 0) {
    onDismiss();
    return null;
  }
  const letter = letters[idx];
  const isLast = idx === letters.length - 1;
  const next = () => {
    if (isLast) onDismiss();else setIdx(i => i + 1);
  };
  const renderLetter = () => {
    // ── Monthly finance summary ──
    if (letter.type === "finance_summary") {
      const isNeg = letter.balance < 0;
      const isLow = letter.balance < 500 && letter.balance >= 0;
      const extras = letter.extraItems || [];
      return /*#__PURE__*/React.createElement("div", {
        style: {
          animation: "popIn .3s ease"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: isNeg ? C.redSoft : C.surfaceAlt,
          border: `1px solid ${isNeg ? C.red : C.border}`,
          borderRadius: 14,
          padding: "24px 28px",
          marginBottom: 16
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: C.sub,
          letterSpacing: 3,
          marginBottom: 12,
          fontWeight: 600
        }
      }, "MONTHLY STATEMENT \xB7 ", MONTH_NAMES[calMonIdx(s.month)].toUpperCase(), ", YEAR ", calYear(s.month)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Lora',serif",
          fontSize: 18,
          fontWeight: 700,
          color: C.text,
          marginBottom: 20
        }
      }, "\uD83D\uDCB0 Financial Summary"), /*#__PURE__*/React.createElement("div", {
        style: {
          marginBottom: 16
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 0",
          borderBottom: `1px solid ${C.border}`,
          fontSize: 13
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.sub
        }
      }, "PhD Stipend (from advisor)"), /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.green,
          fontWeight: 600
        }
      }, "+$", MONTHLY_SALARY.toLocaleString())), letter.nsfBonus > 0 && /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 0",
          borderBottom: `1px solid ${C.border}`,
          fontSize: 13
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.sub
        }
      }, "NSF Fellowship Supplement"), /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.green,
          fontWeight: 600
        }
      }, "+$", letter.nsfBonus.toLocaleString())), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 0",
          borderBottom: `1px solid ${C.border}`,
          fontSize: 13
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.sub
        }
      }, "Apartment rent & living expenses"), /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.red,
          fontWeight: 600
        }
      }, "\u2212$", letter.expenses.toLocaleString())), extras.map((item, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 0",
          borderBottom: `1px solid ${C.border}`,
          fontSize: 13
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.sub
        }
      }, item.label), /*#__PURE__*/React.createElement("span", {
        style: {
          color: item.amount >= 0 ? C.green : C.red,
          fontWeight: 600
        }
      }, item.amount >= 0 ? "+" : "", item.amount < 0 ? `−$${Math.abs(item.amount).toLocaleString()}` : `$${item.amount.toLocaleString()}`))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0",
          fontSize: 13,
          fontWeight: 700
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.text
        }
      }, "Account balance"), /*#__PURE__*/React.createElement("span", {
        style: {
          color: letter.balance < 0 ? C.red : letter.balance < 500 ? C.amber : C.text
        }
      }, "$", letter.balance.toLocaleString()))), isLow && !isNeg && /*#__PURE__*/React.createElement("div", {
        style: {
          background: C.amberSoft,
          border: `1px solid ${C.amber}`,
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 12,
          color: C.amber,
          fontWeight: 600
        }
      }, "\u26A0\uFE0F Funds are running low. Apply for NSF Fellowship in October ($10k one-time).")));
    }

    // ── Paper decision letter ──
    if (letter.type === "paper_decision") {
      const {
        outcome,
        paperId,
        journal,
        revisionRound
      } = letter;
      const jFull = JOURNALS[journal]?.name || journal;
      if (outcome === "accept") {
        const isOPRE = journal === "OPRE";
        const mhBoost = isOPRE ? 100 : 10 + (journal === "EJOR" ? 12 : 6);
        const repBoost = isOPRE ? 100 : journal === "EJOR" ? 8 : 4;
        const advBoost = isOPRE ? 100 : 5;
        return /*#__PURE__*/React.createElement("div", {
          style: {
            animation: "popIn .35s ease"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            background: isOPRE ? C.amberSoft : C.greenSoft,
            border: `2px solid ${isOPRE ? C.amber : C.green}`,
            borderRadius: 14,
            padding: "28px 32px",
            marginBottom: 16,
            position: "relative",
            overflow: "hidden"
          }
        }, /*#__PURE__*/React.createElement(Confetti, null), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            color: isOPRE ? C.amber : C.green,
            letterSpacing: 3,
            marginBottom: 12,
            fontWeight: 600
          }
        }, "DECISION LETTER \xB7 ", jFull.toUpperCase()), /*#__PURE__*/React.createElement("div", {
          style: {
            fontFamily: "'Lora',serif",
            fontSize: 22,
            fontWeight: 700,
            color: isOPRE ? C.amber : C.green,
            marginBottom: 16
          }
        }, isOPRE ? "🏆 Outstanding Achievement!" : "🎉 Acceptance Notification"), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 13,
            color: C.text,
            lineHeight: 1.9,
            marginBottom: 20
          }
        }, /*#__PURE__*/React.createElement("p", {
          style: {
            marginBottom: 8
          }
        }, "Dear Author,"), /*#__PURE__*/React.createElement("p", {
          style: {
            marginBottom: 8
          }
        }, "We are pleased to inform you that your manuscript ", /*#__PURE__*/React.createElement("strong", null, "\"", paperId, "\""), " has been accepted for publication in ", /*#__PURE__*/React.createElement("strong", null, jFull), "."), isOPRE && /*#__PURE__*/React.createElement("p", {
          style: {
            marginBottom: 8,
            color: C.amber,
            fontWeight: 600
          }
        }, "Publishing in Operations Research is an extraordinary accomplishment that will define your academic career. Your advisor and department are immensely proud."), /*#__PURE__*/React.createElement("p", null, "Sincerely,", /*#__PURE__*/React.createElement("br", null), "The Editorial Board, ", journal)), /*#__PURE__*/React.createElement("div", {
          style: {
            display: "flex",
            gap: 16,
            padding: "12px 16px",
            background: C.inset,
            borderRadius: 10
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            textAlign: "center"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            color: C.sub
          }
        }, "Mood"), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 16,
            fontWeight: 700,
            color: C.green
          }
        }, "+", mhBoost)), /*#__PURE__*/React.createElement("div", {
          style: {
            textAlign: "center"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            color: C.sub
          }
        }, "Reputation"), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 16,
            fontWeight: 700,
            color: C.amber
          }
        }, "+", repBoost)), /*#__PURE__*/React.createElement("div", {
          style: {
            textAlign: "center"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            color: C.sub
          }
        }, "Advisor Rel."), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 16,
            fontWeight: 700,
            color: C.accent
          }
        }, "+", advBoost)), /*#__PURE__*/React.createElement("div", {
          style: {
            textAlign: "center"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            color: C.sub
          }
        }, "Publication"), /*#__PURE__*/React.createElement(Pill, {
          color: "#fff",
          bg: isOPRE ? C.amber : journal === "EJOR" ? C.accent : C.green,
          small: true
        }, "+1 ", journal)))));
      }
      if (outcome === "major_revision") {
        const nextRound = revisionRound || 1;
        const nextRates = OPRE_RATES[Math.min(nextRound, 2)];
        return /*#__PURE__*/React.createElement("div", {
          style: {
            animation: "popIn .35s ease"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            background: C.amberSoft,
            border: `2px solid ${C.amber}`,
            borderRadius: 14,
            padding: "28px 32px",
            marginBottom: 16
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            color: C.amber,
            letterSpacing: 3,
            marginBottom: 12,
            fontWeight: 600
          }
        }, "DECISION LETTER \xB7 ", jFull.toUpperCase()), /*#__PURE__*/React.createElement("div", {
          style: {
            fontFamily: "'Lora',serif",
            fontSize: 22,
            fontWeight: 700,
            color: C.amber,
            marginBottom: 16
          }
        }, "\uD83D\uDCDD Major Revision Required ", journal === "OPRE" && `(Round ${nextRound})`), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 13,
            color: C.text,
            lineHeight: 1.9,
            marginBottom: 20
          }
        }, /*#__PURE__*/React.createElement("p", {
          style: {
            marginBottom: 8
          }
        }, "Dear Author,"), /*#__PURE__*/React.createElement("p", {
          style: {
            marginBottom: 8
          }
        }, "Thank you for submitting ", /*#__PURE__*/React.createElement("strong", null, "\"", paperId, "\""), " to ", /*#__PURE__*/React.createElement("strong", null, jFull), ". After peer review, we invite you to submit a ", /*#__PURE__*/React.createElement("strong", null, "major revision"), "."), /*#__PURE__*/React.createElement("p", {
          style: {
            marginBottom: 8
          }
        }, "The reviewers have identified significant concerns that must be addressed before the manuscript can be considered for publication. Please revise and resubmit."), /*#__PURE__*/React.createElement("p", null, "Sincerely,", /*#__PURE__*/React.createElement("br", null), "The Editorial Board, ", journal)), journal === "OPRE" && nextRates && /*#__PURE__*/React.createElement("div", {
          style: {
            background: C.inset,
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 11,
            color: C.sub,
            marginBottom: 8
          }
        }, /*#__PURE__*/React.createElement("strong", {
          style: {
            color: C.amber
          }
        }, "Next round rates (Round ", nextRound, "):"), " ", "Accept ", Math.round(nextRates.accept * 100), "% \xB7 Major ", Math.round(nextRates.major * 100), "% \xB7 Reject ", Math.round(nextRates.reject * 100), "%", nextRound >= 2 && /*#__PURE__*/React.createElement("span", {
          style: {
            color: C.red
          }
        }, " \u2014 no further major revision possible")), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 12,
            color: C.amber,
            fontWeight: 600
          }
        }, "\u2192 Revise (+WQ) then resubmit from Papers Awaiting Action.")));
      }

      // Reject
      return /*#__PURE__*/React.createElement("div", {
        style: {
          animation: "popIn .35s ease"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: C.redSoft,
          border: `2px solid ${C.red}`,
          borderRadius: 14,
          padding: "28px 32px",
          marginBottom: 16
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: C.red,
          letterSpacing: 3,
          marginBottom: 12,
          fontWeight: 600
        }
      }, "DECISION LETTER \xB7 ", jFull.toUpperCase()), /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Lora',serif",
          fontSize: 22,
          fontWeight: 700,
          color: C.red,
          marginBottom: 16
        }
      }, "\u274C Rejection Notice"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: C.text,
          lineHeight: 1.9,
          marginBottom: 20
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "Dear Author,"), /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "We regret to inform you that your manuscript ", /*#__PURE__*/React.createElement("strong", null, "\"", paperId, "\""), " submitted to", /*#__PURE__*/React.createElement("strong", null, " ", jFull), " has not been accepted for publication."), /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "The reviewers felt the manuscript does not meet the current standards required for publication. You may consider submitting to another venue."), /*#__PURE__*/React.createElement("p", null, "Sincerely,", /*#__PURE__*/React.createElement("br", null), "The Editorial Board, ", journal)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: C.sub,
          marginBottom: 8
        }
      }, "\u2192 You can resubmit to a different journal from Papers Awaiting Action."), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 16,
          padding: "10px 14px",
          background: C.redSoft,
          borderRadius: 8,
          fontSize: 11
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.red,
          fontWeight: 600
        }
      }, "Mood \u221210"), /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.red,
          fontWeight: 600
        }
      }, "Advisor Relation \u22125"))));
    }

    // ── NSF award ──
    if (letter.type === "nsf_award") {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          animation: "popIn .35s ease"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: C.greenSoft,
          border: `2px solid ${C.green}`,
          borderRadius: 14,
          padding: "28px 32px",
          marginBottom: 16
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: C.green,
          letterSpacing: 3,
          marginBottom: 12,
          fontWeight: 600
        }
      }, "OFFICIAL LETTER \xB7 NATIONAL SCIENCE FOUNDATION"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Lora',serif",
          fontSize: 22,
          fontWeight: 700,
          color: C.green,
          marginBottom: 16
        }
      }, "\uD83C\uDFC5 NSF Graduate Fellowship \u2014 Awarded!"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: C.text,
          lineHeight: 1.9,
          marginBottom: 20
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "Dear Fellow,"), /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "On behalf of the National Science Foundation, we are honored to inform you that you have been selected as an ", /*#__PURE__*/React.createElement("strong", null, "NSF Graduate Research Fellow"), "."), /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "Your fellowship includes a ", /*#__PURE__*/React.createElement("strong", null, "$10,000 one-time award"), " deposited directly to your account."), /*#__PURE__*/React.createElement("p", null, "Congratulations,", /*#__PURE__*/React.createElement("br", null), "NSF Division of Graduate Education")), /*#__PURE__*/React.createElement("div", {
        style: {
          padding: "12px 16px",
          background: C.inset,
          borderRadius: 10,
          fontSize: 13,
          color: C.green,
          fontWeight: 600,
          marginBottom: 8
        }
      }, "\uD83D\uDCB0 +$10,000 one-time deposit to your account!"), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 16,
          padding: "10px 14px",
          background: C.greenSoft,
          borderRadius: 8,
          fontSize: 11
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.green,
          fontWeight: 600
        }
      }, "Mood +20"))));
    }

    // ── NSF reject ──
    if (letter.type === "nsf_reject") {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          animation: "popIn .35s ease"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: C.surfaceAlt,
          border: `2px solid ${C.border}`,
          borderRadius: 14,
          padding: "28px 32px",
          marginBottom: 16
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: C.sub,
          letterSpacing: 3,
          marginBottom: 12,
          fontWeight: 600
        }
      }, "OFFICIAL LETTER \xB7 NATIONAL SCIENCE FOUNDATION"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Lora',serif",
          fontSize: 22,
          fontWeight: 700,
          color: C.sub,
          marginBottom: 16
        }
      }, "NSF Graduate Fellowship \u2014 Not Selected"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: C.text,
          lineHeight: 1.9,
          marginBottom: 20
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "Dear Applicant,"), /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "Thank you for your application to the NSF Graduate Research Fellowship Program. After careful review, we regret to inform you that you were ", /*#__PURE__*/React.createElement("strong", null, "not selected"), " in this cycle."), /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "The fellowship is highly competitive. You may apply again next October. Building your publication record will improve future chances."), /*#__PURE__*/React.createElement("p", null, "Regards,", /*#__PURE__*/React.createElement("br", null), "NSF Division of Graduate Education")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: C.muted,
          marginBottom: 8
        }
      }, "\u2192 You can reapply next October. More publications = higher chance."), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 16,
          padding: "10px 14px",
          background: C.redSoft,
          borderRadius: 8,
          fontSize: 11
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: C.red,
          fontWeight: 600
        }
      }, "Mood \u221210"))));
    }

    // ── INFORMS attend notification ──
    if (letter.type === "informs_attend") {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          animation: "popIn .35s ease"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: C.tealSoft,
          border: `2px solid ${C.teal}`,
          borderRadius: 14,
          padding: "28px 32px",
          marginBottom: 16
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Lora',serif",
          fontSize: 22,
          fontWeight: 700,
          color: C.teal,
          marginBottom: 16
        }
      }, "\uD83C\uDF89 INFORMS Annual Meeting"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: C.text,
          lineHeight: 1.9,
          marginBottom: 20
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "You attended the INFORMS Annual Conference. Three days of talks, poster sessions, and networking. Your presentation was well received."), letter.gotIdea && /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8,
          color: C.amber,
          fontWeight: 600
        }
      }, "\uD83D\uDCA1 A conversation with a fellow researcher sparked a new research idea!")), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 16,
          padding: "12px 16px",
          background: C.inset,
          borderRadius: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: C.sub
        }
      }, "Mood"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 700,
          color: C.green
        }
      }, "+15")), /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: C.sub
        }
      }, "Reputation"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 700,
          color: C.amber
        }
      }, "+8")), letter.gotIdea && /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: C.sub
        }
      }, "New Idea"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 700,
          color: C.amber
        }
      }, "\uD83D\uDCA1 +1")))));
    }

    // ── Comprehensive exam result ──
    if (letter.type === "comp_exam") {
      const passed = letter.passed;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          animation: "popIn .35s ease"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: passed ? C.greenSoft : C.redSoft,
          border: `2px solid ${passed ? C.green : C.red}`,
          borderRadius: 14,
          padding: "28px 32px",
          marginBottom: 16
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: passed ? C.green : C.red,
          letterSpacing: 3,
          marginBottom: 12,
          fontWeight: 600
        }
      }, "OFFICIAL RESULT \xB7 DEPARTMENT OF OPERATIONS RESEARCH"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Lora',serif",
          fontSize: 22,
          fontWeight: 700,
          color: passed ? C.green : C.red,
          marginBottom: 16
        }
      }, passed ? "🎉 Comprehensive Exam — PASSED" : "❌ Comprehensive Exam — FAILED"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: C.text,
          lineHeight: 1.9,
          marginBottom: 20
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "Dear Doctoral Candidate,"), passed ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "We are pleased to inform you that you have successfully passed the Doctoral Comprehensive Examination (Attempt ", letter.attempt, "). Your pass probability was ", /*#__PURE__*/React.createElement("strong", null, letter.chance, "%"), " based on your preparation."), /*#__PURE__*/React.createElement("p", null, "You are now officially a PhD Candidate. Congratulations!")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "We regret to inform you that you did not pass the Doctoral Comprehensive Examination (Attempt ", letter.attempt, "). Your pass probability was ", /*#__PURE__*/React.createElement("strong", null, letter.chance, "%"), "."), letter.attempt === 1 && /*#__PURE__*/React.createElement("p", {
        style: {
          color: C.amber,
          fontWeight: 600
        }
      }, "You have one remaining attempt in November. Study harder to improve your chances.")), /*#__PURE__*/React.createElement("p", {
        style: {
          marginTop: 8
        }
      }, "Regards,", /*#__PURE__*/React.createElement("br", null), "The Doctoral Committee")), passed && /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 16,
          padding: "12px 16px",
          background: C.inset,
          borderRadius: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: C.sub
        }
      }, "Knowledge"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 700,
          color: C.blue
        }
      }, "+10")), /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: C.sub
        }
      }, "Reputation"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          fontWeight: 700,
          color: C.amber
        }
      }, "+8")))));
    }

    // ── Advisor Year-3 performance review ──
    if (letter.type === "advisor_y3_review") {
      const {
        verdict
      } = letter;
      const cfg = {
        satisfied: {
          bg: C.greenSoft,
          border: C.green,
          color: C.green,
          icon: "😊",
          title: "Year 3 Review — Advisor is Satisfied",
          body: "Your advisor called you in for the annual review meeting and expressed genuine satisfaction with your progress. Having a published paper at this stage puts you ahead of schedule. Keep up the excellent work.",
          effect: /*#__PURE__*/React.createElement("div", {
            style: {
              fontSize: 12,
              color: C.green,
              fontWeight: 600
            }
          }, "Advisor Relation +10 \xB7 Reputation +5")
        },
        upset: {
          bg: C.amberSoft,
          border: C.amber,
          color: C.amber,
          icon: "😟",
          title: "Year 3 Review — Advisor is Disappointed",
          body: "Your advisor reviewed your progress and expressed concern. You are already in your third year with no publications. Your manuscripts exist, but none have cleared the review process. You need to accelerate — significantly.",
          effect: /*#__PURE__*/React.createElement("div", {
            style: {
              fontSize: 12,
              color: C.amber,
              fontWeight: 600
            }
          }, "Advisor Relation \u221220 \xB7 Push harder to publish!")
        },
        very_upset: {
          bg: C.redSoft,
          border: C.red,
          color: C.red,
          icon: "😡",
          title: "Year 3 Review — Advisor is Very Upset",
          body: "Your advisor is alarmed. Three years in and you have not even begun writing a paper. This is far below the expected standard for a doctoral candidate at this stage. Your position in the program may be at risk if you do not produce tangible output immediately.",
          effect: /*#__PURE__*/React.createElement("div", {
            style: {
              fontSize: 12,
              color: C.red,
              fontWeight: 600
            }
          }, "Advisor Relation \u221235 \xB7 Your program status is at risk!")
        }
      }[verdict];
      return /*#__PURE__*/React.createElement("div", {
        style: {
          animation: "popIn .35s ease"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: cfg.bg,
          border: `2px solid ${cfg.border}`,
          borderRadius: 14,
          padding: "28px 32px",
          marginBottom: 16
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: cfg.color,
          letterSpacing: 3,
          marginBottom: 12,
          fontWeight: 600
        }
      }, "ANNUAL REVIEW \xB7 END OF YEAR 3"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Lora',serif",
          fontSize: 22,
          fontWeight: 700,
          color: cfg.color,
          marginBottom: 16
        }
      }, cfg.icon, " ", cfg.title), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: C.text,
          lineHeight: 1.9,
          marginBottom: 20
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, "Dear Doctoral Student,"), /*#__PURE__*/React.createElement("p", {
        style: {
          marginBottom: 8
        }
      }, cfg.body), /*#__PURE__*/React.createElement("p", null, "Regards,", /*#__PURE__*/React.createElement("br", null), "Your PhD Advisor")), /*#__PURE__*/React.createElement("div", {
        style: {
          padding: "10px 14px",
          background: C.inset,
          borderRadius: 10
        }
      }, cfg.effect)));
    }
    return null;
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeIn .3s ease"
    }
  }, renderLetter(), /*#__PURE__*/React.createElement(Btn, {
    onClick: next,
    variant: "primary"
  }, isLast ? "Continue →" : `Next Letter (${letters.length - idx - 1} more)`));
}

// ─── RECENT LOG BAR ───────────────────────────────────────────────────────────

function RecentLog({
  log
}) {
  const C = useC();
  const recent = (log || []).slice(0, 3);
  if (recent.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.surfaceAlt,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: C.muted,
      letterSpacing: 2,
      fontWeight: 600,
      marginBottom: 6
    }
  }, "RECENT ACTIVITY"), recent.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: 11,
      color: i === 0 ? C.text : C.muted,
      paddingBottom: i < recent.length - 1 ? 5 : 0,
      marginBottom: i < recent.length - 1 ? 5 : 0,
      borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none",
      lineHeight: 1.5,
      opacity: 1 - i * 0.25
    }
  }, e)));
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({
  s,
  view,
  setView,
  onQuit
}) {
  const C = useC();
  const year = calYear(s.month);
  const mi = calMonIdx(s.month);
  const pct = s.month / MAX_MONTHS;
  const barCol = s.month > 60 ? C.red : s.month > 48 ? C.amber : C.accent;
  const tabs = ["game", "papers", "log"];
  const seasonEmoji = [2, 3, 4].includes(mi) ? "🌸" : [5, 6, 7].includes(mi) ? "☀️" : [8, 9, 10].includes(mi) ? "🍂" : "⛄";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 210,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Timeline"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, seasonEmoji), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 22,
      fontWeight: 700,
      color: C.text
    }
  }, MONTH_NAMES[mi], " Y", year)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.sub,
      marginBottom: 8
    }
  }, "Month ", s.month, " of ", MAX_MONTHS), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      background: C.border,
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct * 100}%`,
      height: "100%",
      background: barCol,
      borderRadius: 3,
      transition: "width .5s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.muted,
      marginBottom: 10
    }
  }, MAX_MONTHS - s.month, " months left"), /*#__PURE__*/React.createElement("button", {
    onClick: onQuit,
    style: {
      width: "100%",
      padding: "5px 0",
      fontSize: 10,
      fontWeight: 600,
      fontFamily: "'DM Mono',monospace",
      cursor: "pointer",
      borderRadius: 6,
      background: "transparent",
      color: C.muted,
      border: `1px solid ${C.border}`,
      letterSpacing: 1,
      textTransform: "uppercase"
    }
  }, "\u2715 Quit Game")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Resources"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: C.sub
    }
  }, "\uD83D\uDCB0 Money"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: s.money < 500 ? C.red : C.green
    }
  }, "$", s.money.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: C.sub
    }
  }, "\uD83D\uDCA1 Ideas"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: s.ideas > 0 ? C.amber : C.muted
    }
  }, s.ideas)), s.money < 500 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.red,
      fontWeight: 600
    }
  }, "\u26A0\uFE0F Low funds!"), s.ideas === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.amber
    }
  }, "No ideas \u2014 read papers!")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Stats"), /*#__PURE__*/React.createElement(StatBar, {
    label: "Mood",
    value: s.mentalHealth,
    color: C.green
  }), /*#__PURE__*/React.createElement(StatBar, {
    label: "Domain Knowledge",
    value: s.domainKnowledge,
    color: C.blue
  }), /*#__PURE__*/React.createElement(StatBar, {
    label: "Reputation",
    value: s.academicReputation,
    color: C.amber
  }), /*#__PURE__*/React.createElement(StatBar, {
    label: "Advisor Relation",
    value: s.advisorRelation,
    color: C.accent
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Publications"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      marginBottom: 6
    }
  }, s.pubHigh > 0 && /*#__PURE__*/React.createElement(Pill, {
    color: "#fff",
    bg: C.amber
  }, s.pubHigh, " OPRE"), s.pubMedian > 0 && /*#__PURE__*/React.createElement(Pill, {
    color: "#fff",
    bg: C.accent
  }, s.pubMedian, " EJOR"), s.pubLow > 0 && /*#__PURE__*/React.createElement(Pill, {
    color: "#fff",
    bg: C.green
  }, s.pubLow, " COR"), s.pubHigh + s.pubMedian + s.pubLow === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: C.muted
    }
  }, "None yet")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.sub
    }
  }, "Submissions: ", s.submittedCount), s.canWriteThesis && !s.thesisStarted && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 10,
      color: C.green,
      fontWeight: 600
    }
  }, "\u2705 Thesis eligible!"), s.thesisStarted && !s.thesisComplete && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 10,
      color: C.accent
    }
  }, "\uD83D\uDCD6 Thesis: ", s.thesisProgress, "%"), !s.compExamPassed && s.month < COMP_EXAM_MONTH_2 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 10,
      color: C.blue
    }
  }, "\uD83D\uDCCB Comp exam: ", s.month < COMP_EXAM_MONTH_1 ? "Jul Y2" : "Nov Y2", " \xB7 ", Math.min(Math.round((COMP_EXAM_BASE_CHANCE + (s.compExamStudySessions || 0) * COMP_EXAM_STUDY_BONUS) * 100), 97), "% ready"), s.compExamPassed && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 10,
      color: C.green,
      fontWeight: 600
    }
  }, "\u2705 Comp exam passed!")), (s.informsApplied || s.informsAccepted || s.nsfApplied || s.nsfEverWon) && /*#__PURE__*/React.createElement(Card, {
    style: {
      background: C.tealSoft,
      border: `1px solid ${C.teal}`
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    color: C.teal
  }, "Grants & Conf."), (s.informsApplied || s.informsAccepted) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.teal,
      fontWeight: 600,
      marginBottom: 4
    }
  }, "INFORMS: ", s.informsAccepted ? "✅ Accepted — Oct!" : "⏳ Pending…"), s.nsfApplied && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.teal,
      fontWeight: 600,
      marginBottom: 4
    }
  }, "NSF: \u23F3 Decision in May"), s.nsfEverWon && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.green,
      fontWeight: 600
    }
  }, "\uD83C\uDFC5 NSF Fellow (awarded)")), (s.journalReviews.length > 0 || s.pendingAdvisorReview) && /*#__PURE__*/React.createElement(Card, {
    style: {
      background: C.blueSoft,
      border: `1px solid #b3cde8`
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    color: C.blue
  }, "Under Review"), s.journalReviews.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.paperId + r.journal,
    style: {
      fontSize: 10,
      color: C.text,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, r.paperId), " @ ", r.journal, /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.blue,
      marginLeft: 4
    }
  }, "\xB7", r.monthsLeft, "mo"))), s.pendingAdvisorReview && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, s.pendingAdvisorReview.paperId), " @ Advisor", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.blue,
      marginLeft: 4
    }
  }, "\xB7", s.pendingAdvisorReview.monthsLeft, "mo"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setView(t),
    style: {
      flex: 1,
      padding: "6px 0",
      fontSize: 9,
      fontWeight: 600,
      fontFamily: "'DM Mono',monospace",
      letterSpacing: 1,
      cursor: "pointer",
      background: view === t ? C.accent : C.surfaceAlt,
      color: view === t ? "#fff" : C.sub,
      border: `1px solid ${view === t ? C.accent : C.border}`,
      borderRadius: 6,
      textTransform: "uppercase"
    }
  }, t))));
}

// ─── EVENT PANEL ──────────────────────────────────────────────────────────────

function EventPanel({
  s,
  onChoice
}) {
  const C = useC();
  const ev = s.currentEvent;
  if (!ev) return null;
  const catCol = {
    Academic: C.blue,
    Personal: C.rose,
    School: C.amber
  }[ev.category] || C.accent;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeIn .3s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Pill, {
    color: catCol,
    bg: catCol + "22"
  }, ev.category), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: C.muted,
      letterSpacing: 2
    }
  }, "MONTHLY EVENT")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 20,
      fontWeight: 700,
      color: C.text,
      marginBottom: 8
    }
  }, ev.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.sub,
      marginBottom: 22,
      lineHeight: 1.7
    }
  }, ev.description), ev.options.map((opt, i) => {
    const eff = Object.entries(opt.effects);
    return /*#__PURE__*/React.createElement(ChoiceCard, {
      key: i,
      onClick: () => onChoice(opt)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: C.text,
        fontWeight: 500,
        marginBottom: eff.length ? 5 : 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.accent,
        fontWeight: 700,
        marginRight: 8
      }
    }, String.fromCharCode(65 + i), "."), opt.text), eff.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6
      }
    }, eff.map(([k, v]) => /*#__PURE__*/React.createElement("span", {
      key: k,
      style: {
        fontSize: 10,
        color: v > 0 ? C.green : C.red
      }
    }, k === "money" ? "💰 money" : k === "mentalHealth" ? "mood" : k.replace(/([A-Z])/g, ' $1').trim().toLowerCase(), " ", v > 0 ? "+" : "", v, k === "money" ? " USD" : ""))));
  }));
}

// ─── WORK CHOICE PANEL ────────────────────────────────────────────────────────

function WorkChoicePanel({
  s,
  onAction
}) {
  const C = useC();
  const writable = writableProjects(s);
  const actionable = actionablePapers(s);
  const writing = s.writingPaperId ? s.papers.find(p => p.id === s.writingPaperId) : null;
  const activeProj = s.activeProject ? s.projects.find(p => p.id === s.activeProject) : null;
  const mi = monthIdx(s.month);
  const leisure = availableLeisure(s.month);
  const canNewProject = !hasActiveWork(s) && s.ideas > 0;
  const canApplyINFORMS = mi >= INFORMS_SUBMIT_START && mi <= INFORMS_SUBMIT_END && !s.informsApplied && s.papers.some(p => p.status === "advisor_approved" || p.status === "accepted");
  const canApplyNSF = mi === NSF_APPLY_MONTH && !s.nsfApplied && !s.nsfEverWon;
  // Comp exam: show study option until passed or month > exam 2
  const showCompExamStudy = !s.compExamPassed && s.month < COMP_EXAM_MONTH_2;
  // Show exam status banner if an exam is coming up this month
  const examThisMonth = !s.compExamPassed && (s.month === COMP_EXAM_MONTH_1 || s.month === COMP_EXAM_MONTH_2);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeIn .3s ease"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "\u2699\uFE0F What will you do this month?"), s.taDoneThisMonth && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff8e1",
      border: `1.5px solid ${C.amber}`,
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.amber,
      fontWeight: 700
    }
  }, "\uD83D\uDCDA TA Duties Active This Month"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.amber,
      marginTop: 3
    }
  }, "You're teaching this month \u2014 research is on hold. Use your time for writing, reading, or resting.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 16
    }
  }, showCompExamStudy && /*#__PURE__*/React.createElement(ChoiceCard, {
    onClick: () => onAction("study_comp_exam"),
    color: C.blue,
    highlight: examThisMonth
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.blue
    }
  }, "\uD83D\uDCCB Study for Comp Exam"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.blue,
      marginTop: 3
    }
  }, "Sessions: ", s.compExamStudySessions || 0, " \xB7 Pass chance: ", Math.min(Math.round((COMP_EXAM_BASE_CHANCE + (s.compExamStudySessions || 0) * COMP_EXAM_STUDY_BONUS) * 100), 97), "%")), examThisMonth && /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1/-1",
      background: C.blueSoft,
      border: `1.5px solid ${C.blue}`,
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.blue,
      fontWeight: 700
    }
  }, "\uD83D\uDCCB Comprehensive Exam is this month!", s.month === COMP_EXAM_MONTH_1 ? " (Attempt 1/2 — July)" : " (Attempt 2/2 — November)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.blue,
      marginTop: 3
    }
  }, "Current pass chance: ", Math.min(Math.round((COMP_EXAM_BASE_CHANCE + (s.compExamStudySessions || 0) * COMP_EXAM_STUDY_BONUS) * 100), 97), "%", " ", "\xB7 Choose any action to advance and take the exam.")), /*#__PURE__*/React.createElement(ChoiceCard, {
    onClick: () => onAction("research"),
    disabled: !s.activeProject || activeProj?.solved || s.taDoneThisMonth
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: s.taDoneThisMonth ? C.muted : C.text
    }
  }, "\uD83D\uDD2C Research"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.sub,
      marginTop: 3
    }
  }, s.taDoneThisMonth ? "Busy with TA duties this month" : s.activeProject ? activeProj?.solved ? "Solved — write a paper!" : `${s.activeProject} · ${activeProj?.monthsSpent || 0} months` : "No active project")), /*#__PURE__*/React.createElement(ChoiceCard, {
    onClick: () => onAction("new_project"),
    disabled: !canNewProject,
    color: canNewProject ? C.amber : undefined,
    highlight: canNewProject
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: canNewProject ? C.amber : C.muted
    }
  }, "\u2728 New Project"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: canNewProject ? C.amber : C.muted,
      marginTop: 3
    }
  }, s.ideas === 0 ? "Need an idea first" : hasActiveWork(s) ? "Finish current work first" : `💡 ${s.ideas} idea available`)), /*#__PURE__*/React.createElement(ChoiceCard, {
    onClick: () => onAction("read_papers")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.text
    }
  }, "\uD83D\uDCDA Read Papers"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.sub,
      marginTop: 3
    }
  }, "Gain knowledge \xB7 chance of new idea")), writable.map(proj => /*#__PURE__*/React.createElement(ChoiceCard, {
    key: proj.id,
    onClick: () => onAction(`write::${proj.id}`),
    highlight: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.accent
    }
  }, "\u270D\uFE0F Write Paper"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.accent,
      marginTop: 3
    }
  }, proj.id, " \u2014 solved!"))), writing && /*#__PURE__*/React.createElement(ChoiceCard, {
    onClick: () => onAction("continue_writing"),
    highlight: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.accent
    }
  }, "\uD83D\uDCDD Continue Writing"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.accent,
      marginTop: 3
    }
  }, writing.id, " \xB7 WQ:", writing.wq || 0, " RQ:", writing.rq || 0)), canApplyINFORMS && /*#__PURE__*/React.createElement(ChoiceCard, {
    onClick: () => onAction("apply_informs"),
    color: C.teal,
    highlight: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.teal
    }
  }, "\uD83C\uDFC6 Apply to INFORMS"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.teal,
      marginTop: 3
    }
  }, "Submission open Mar\u2013Jun \xB7 Conf in Oct")), canApplyNSF && /*#__PURE__*/React.createElement(ChoiceCard, {
    onClick: () => onAction("apply_nsf"),
    color: C.green,
    highlight: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.green
    }
  }, "\uD83C\uDFC5 Apply for NSF Fellowship"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.green,
      marginTop: 3
    }
  }, "October only \xB7 Results in May \xB7 $10k one-time if awarded")), s.canWriteThesis && !s.thesisStarted && /*#__PURE__*/React.createElement(ChoiceCard, {
    onClick: () => onAction("thesis"),
    color: C.green,
    highlight: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.green
    }
  }, "\uD83C\uDF93 Write Thesis"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.green,
      marginTop: 3
    }
  }, "3 months to finish")), s.thesisStarted && !s.thesisComplete && /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 10,
      border: `1px solid ${C.accent}`,
      background: C.accentSoft,
      padding: "12px 14px",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.accent
    }
  }, "\uD83D\uDCD6 Thesis in progress"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.accent,
      marginTop: 3
    }
  }, s.thesisProgress, "% complete")), /*#__PURE__*/React.createElement(ChoiceCard, {
    onClick: () => onAction("rest")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.text
    }
  }, "\uD83D\uDECB\uFE0F Rest"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.sub,
      marginTop: 3
    }
  }, "Mental health +10"))), leisure.length > 0 && /*#__PURE__*/React.createElement(Card, {
    style: {
      background: C.roseSoft,
      border: `1px solid ${C.rose}22`
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    color: C.rose
  }, "\uD83C\uDF89 Leisure Activities"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, leisure.map(act => /*#__PURE__*/React.createElement(ChoiceCard, {
    key: act.id,
    onClick: () => onAction(`leisure::${act.id}`),
    disabled: s.money < act.cost,
    color: C.rose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: C.text
    }
  }, act.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.rose,
      marginTop: 3
    }
  }, "\uD83D\uDCB0 $", act.cost, " \xB7 \uD83D\uDE0A +", act.mhGain, " mood"))))), actionable.length > 0 && /*#__PURE__*/React.createElement(Card, {
    style: {
      background: C.surfaceAlt
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    color: C.red
  }, "\uD83D\uDCEC Papers Awaiting Action"), actionable.map(paper => {
    const elig = eligibleJournals(paper);
    return /*#__PURE__*/React.createElement("div", {
      key: paper.id,
      style: {
        marginBottom: 14,
        paddingBottom: 14,
        borderBottom: `1px solid ${C.border}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        fontSize: 13,
        color: C.text
      }
    }, paper.id), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: C.sub
      }
    }, "RQ:", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: C.blue
      }
    }, paper.rq || 0), " WQ:", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: C.accent
      }
    }, paper.wq || 0))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: C.sub,
        marginBottom: 8
      }
    }, "Status: ", /*#__PURE__*/React.createElement("strong", null, paper.status), paper.advisorLevel && ` · Advisor suggests: ${paper.advisorLevel}`, paper.pendingJournal && ` · Revise for: ${paper.pendingJournal}`, paper.revisionCount > 0 && ` · Round ${paper.revisionCount}`), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6
      }
    }, Object.keys(JOURNALS).map(j => {
      const canSubmit = elig.includes(j) && !(paper.rejectedFrom || []).includes(j) && paper.status !== "under_review";
      // For OPRE after 2 revision rounds: no more major revision possible, label it as final round
      const isOpreFinal = j === "OPRE" && (paper.revisionCount || 0) >= 2;
      return /*#__PURE__*/React.createElement(Btn, {
        key: j,
        small: true,
        disabled: !canSubmit,
        onClick: () => onAction(`submit::${paper.id}::${j}`),
        variant: j === "OPRE" ? "danger" : j === "EJOR" ? "primary" : "success"
      }, "\u2192 ", j, isOpreFinal ? " (final)" : "");
    }), (paper.status === "rejected" || paper.status === "major_revision") && /*#__PURE__*/React.createElement(Btn, {
      small: true,
      onClick: () => onAction(`revise::${paper.id}`),
      variant: "neutral"
    }, "\uD83D\uDD27 Revise (+WQ)")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6,
        display: "flex",
        gap: 6,
        flexWrap: "wrap"
      }
    }, Object.keys(JOURNALS).filter(j => !elig.includes(j) && !(paper.rejectedFrom || []).includes(j)).map(j => {
      const req = JOURNAL_REQS[j];
      const rqOk = (paper.rq || 0) >= req.rq;
      const wqOk = (paper.wq || 0) >= req.wq;
      return /*#__PURE__*/React.createElement("span", {
        key: j,
        style: {
          fontSize: 9,
          color: C.muted
        }
      }, j, ": ", !rqOk && `RQ needs ${req.rq}`, !rqOk && !wqOk && " · ", !wqOk && `WQ needs ${req.wq}`);
    })));
  })));
}

// ─── RESEARCH PANEL ───────────────────────────────────────────────────────────

function ResearchPanel({
  s,
  onResearch,
  onBack
}) {
  const C = useC();
  const proj = s.projects.find(p => p.id === s.activeProject);
  const eff = proj ? Math.round(s.mentalHealth / 100 * (0.5 + s.domainKnowledge / 200) * 100) : 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeIn .3s ease"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    color: C.blue
  }, "\uD83D\uDD2C Research Session"), proj ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 20,
      fontWeight: 700,
      color: C.text,
      marginBottom: 12
    }
  }, proj.id), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: C.blueSoft,
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      fontWeight: 700,
      color: C.blue,
      fontFamily: "'Lora',serif"
    }
  }, proj.monthsSpent || 0), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: C.blue
    }
  }, "months invested"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.sub
    }
  }, "Efficiency: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: C.blue
    }
  }, eff, "%")))), proj.progress > 100 && !proj.solved && /*#__PURE__*/React.createElement(Card, {
    style: {
      background: C.greenSoft,
      border: `1px solid ${C.green}`,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.green,
      fontWeight: 600
    }
  }, "\uD83C\uDFAF You sense a breakthrough coming! Crack chance: ", Math.round((proj.progress - 100) / 200 * 100), "% this month")), proj.solved && /*#__PURE__*/React.createElement(Card, {
    style: {
      background: C.amberSoft,
      border: `1px solid ${C.amber}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.amber,
      fontWeight: 700
    }
  }, "\u2705 Problem SOLVED! Go back to write a paper.")), !proj.solved && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginBottom: 16,
      lineHeight: 1.7
    }
  }, "Dedicate this month to research. Progress depends on mental health and domain knowledge."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: onResearch,
    variant: "primary"
  }, "Dedicate Month to Research \u2192"), /*#__PURE__*/React.createElement(Btn, {
    onClick: onBack,
    variant: "ghost"
  }, "\u2190 Back"))), proj.solved && /*#__PURE__*/React.createElement(Btn, {
    onClick: onBack,
    variant: "ghost"
  }, "\u2190 Back to Choices")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.sub,
      marginBottom: 14
    }
  }, "No active project."), /*#__PURE__*/React.createElement(Btn, {
    onClick: onBack,
    variant: "ghost"
  }, "\u2190 Back")));
}

// ─── WRITING PANEL ────────────────────────────────────────────────────────────

function WritingPanel({
  s,
  onDevote,
  onSubmitAdvisor,
  onBack,
  onAbolish
}) {
  const C = useC();
  const paper = s.papers.find(p => p.id === s.writingPaperId);
  if (!paper) return /*#__PURE__*/React.createElement("div", {
    style: {
      color: C.sub
    }
  }, "No paper in progress.");
  const rq = paper.rq || 0;
  const wq = paper.wq || 0;
  const [confirmAbolish, setConfirmAbolish] = useState(false);

  // Journal eligibility display
  const journalStatus = Object.keys(JOURNALS).map(j => {
    const req = JOURNAL_REQS[j];
    const rqOk = rq >= req.rq;
    const wqOk = wq >= req.wq;
    const ok = rqOk && wqOk;
    return {
      j,
      req,
      rqOk,
      wqOk,
      ok
    };
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeIn .3s ease"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    color: C.accent
  }, "\u270D\uFE0F Writing Paper"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 20,
      fontWeight: 700,
      color: C.text,
      marginBottom: 16
    }
  }, paper.id), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.blueSoft,
      borderRadius: 10,
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.blue,
      fontWeight: 600,
      letterSpacing: 1,
      marginBottom: 4
    }
  }, "RESEARCH QUALITY (RQ)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: C.blue,
      fontFamily: "'Lora',serif"
    }
  }, rq), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.sub,
      marginTop: 2
    }
  }, "Fixed at project solve")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.accentSoft,
      borderRadius: 10,
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.accent,
      fontWeight: 600,
      letterSpacing: 1,
      marginBottom: 4
    }
  }, "WRITING QUALITY (WQ)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: C.accent,
      fontFamily: "'Lora',serif"
    }
  }, wq), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.sub,
      marginTop: 2
    }
  }, "+0 to +10 per month writing"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.muted,
      letterSpacing: 1.5,
      fontWeight: 600,
      marginBottom: 8
    }
  }, "JOURNAL ELIGIBILITY"), journalStatus.map(({
    j,
    req,
    rqOk,
    wqOk,
    ok
  }) => {
    const jColor = j === "OPRE" ? C.amber : j === "EJOR" ? C.accent : C.green;
    return /*#__PURE__*/React.createElement("div", {
      key: j,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 10px",
        borderRadius: 8,
        marginBottom: 5,
        background: ok ? jColor + "18" : C.surfaceAlt,
        border: `1px solid ${ok ? jColor : C.border}`
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, ok ? "✅" : "❌"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        fontSize: 11,
        color: jColor,
        minWidth: 36
      }
    }, j), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: C.sub,
        flex: 1
      }
    }, JOURNALS[j].name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: rqOk ? C.green : C.red,
        fontWeight: 600
      }
    }, "RQ\u2265", req.rq), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: wqOk ? C.green : C.red,
        fontWeight: 600
      }
    }, "WQ\u2265", req.wq));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginBottom: 18,
      lineHeight: 1.7
    }
  }, "Each writing month adds a random ", /*#__PURE__*/React.createElement("strong", null, "0\u201320 WQ"), ". RQ is locked from your research.", /*#__PURE__*/React.createElement("br", null), "Must write \u22651 month before submitting to advisor."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: confirmAbolish ? 0 : undefined
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: onDevote,
    variant: "primary"
  }, "Devote Month to Writing"), /*#__PURE__*/React.createElement(Btn, {
    onClick: onSubmitAdvisor,
    disabled: paper.monthsWriting < 1,
    variant: "success"
  }, "Submit to Advisor \u2713"), /*#__PURE__*/React.createElement(Btn, {
    onClick: onBack,
    variant: "ghost"
  }, "\u2190 Back"), /*#__PURE__*/React.createElement(Btn, {
    onClick: () => setConfirmAbolish(true),
    variant: "danger",
    small: true
  }, "\uD83D\uDDD1 Abolish Paper")), confirmAbolish && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      background: C.redSoft,
      border: `1.5px solid ${C.red}`,
      borderRadius: 10,
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: C.red,
      marginBottom: 8
    }
  }, "\u26A0\uFE0F Abolish \"", paper.id, "\"?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginBottom: 12,
      lineHeight: 1.6
    }
  }, "This will permanently delete the paper and free the project slot. The RQ of ", /*#__PURE__*/React.createElement("strong", null, rq), " will be lost. This cannot be undone."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => {
      setConfirmAbolish(false);
      onAbolish(paper.id);
    },
    variant: "danger",
    small: true
  }, "Yes, abolish it"), /*#__PURE__*/React.createElement(Btn, {
    onClick: () => setConfirmAbolish(false),
    variant: "neutral",
    small: true
  }, "Cancel"))));
}

// ─── CAREER PANEL ─────────────────────────────────────────────────────────────

function CareerPanel({
  s,
  onChoose
}) {
  const C = useC();
  const hasHigh = s.pubHigh >= 1;
  const hasPostdoc = hasHigh || s.pubMedian >= 2;
  const careers = [{
    key: "academic",
    icon: "🏛️",
    label: "Tenure-Track Faculty",
    qual: hasHigh,
    desc: hasHigh ? "✅ Qualified (1 OPRE paper)" : "❌ Need 1 OPRE paper",
    color: C.green,
    bg: C.greenSoft
  }, {
    key: "postdoc",
    icon: "🔬",
    label: "Postdoctoral Researcher",
    qual: hasPostdoc,
    desc: hasPostdoc ? "✅ Qualified" : "❌ Need 1 OPRE or 2 EJOR",
    color: C.accent,
    bg: C.accentSoft
  }, {
    key: "industry",
    icon: "💼",
    label: "Industry / Consulting",
    qual: true,
    desc: "✅ Always available",
    color: C.blue,
    bg: C.blueSoft
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "fadeIn .3s ease"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    color: C.green
  }, "\uD83C\uDF93 Thesis Complete \u2014 Choose Your Career"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 18,
      fontWeight: 700,
      color: C.text,
      marginBottom: 6
    }
  }, "The Journey Ends Here"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginBottom: 20
    }
  }, s.pubHigh, " OPRE \xB7 ", s.pubMedian, " EJOR \xB7 ", s.pubLow, " COR"), careers.map(c => /*#__PURE__*/React.createElement(ChoiceCard, {
    key: c.key,
    onClick: () => onChoose(c.key),
    color: c.color
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: C.text,
      marginBottom: 4
    }
  }, c.icon, " ", c.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: c.qual ? c.color : C.muted
    }
  }, c.desc)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: c.bg,
      color: c.color,
      borderRadius: 8,
      padding: "4px 10px",
      fontSize: 10,
      fontWeight: 600
    }
  }, c.qual ? "QUALIFY" : "LOCKED")))));
}

// ─── PAPERS TAB ───────────────────────────────────────────────────────────────

function PapersTab({
  s
}) {
  const C = useC();
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "\uD83D\uDCC4 All Papers"), s.papers.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.muted,
      fontSize: 12
    }
  }, "No papers yet."), s.papers.map(p => {
    const rev = s.journalReviews.find(r => r.paperId === p.id);
    const sc = p.status === "accepted" ? C.green : p.status === "rejected" ? C.red : C.sub;
    const elig = eligibleJournals(p);
    return /*#__PURE__*/React.createElement(Card, {
      key: p.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        fontSize: 13,
        color: C.text
      }
    }, p.id), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Pill, {
      color: C.blue,
      bg: C.blueSoft,
      small: true
    }, "RQ:", p.rq || 0), /*#__PURE__*/React.createElement(Pill, {
      color: C.accent,
      bg: C.accentSoft,
      small: true
    }, "WQ:", p.wq || 0))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: sc,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("strong", null, p.status), p.journal && ` · ${p.journal}`, rev && /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.blue
      }
    }, " \xB7 ", rev.monthsLeft, "mo in review"), (p.revisionCount || 0) > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.muted
      }
    }, " \xB7 Rev.", p.revisionCount)), elig.length > 0 && p.status !== "accepted" && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: C.green
      }
    }, "Qualifies for: ", elig.join(", ")));
  }));
}
function LogTab({
  s
}) {
  const C = useC();
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "\uD83D\uDCCB Event Log"), s.log.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: 11,
      color: i === 0 ? C.text : C.muted,
      padding: "7px 0",
      borderBottom: `1px solid ${C.border}`,
      lineHeight: 1.6
    }
  }, e)));
}
function GameOverPanel({
  s,
  onRestart
}) {
  const C = useC();
  const reason = s.gameOverReason || "timeout";
  const configs = {
    timeout: {
      icon: "⏰",
      color: C.red,
      title: "Time's Up",
      body: "Six years passed without completing your PhD."
    },
    bankrupt: {
      icon: "💸",
      color: C.red,
      title: "Bankrupt",
      body: "You ran out of money and had to leave the program."
    },
    mentalHealth: {
      icon: "🧠",
      color: C.rose,
      title: "Mood Crisis",
      body: "Your mood collapsed and you became severely depressed. A doctor has strongly advised you to step away from the PhD program and focus on recovery. It's okay — your wellbeing comes first."
    },
    advisorKick: {
      icon: "🚪",
      color: C.amber,
      title: "Expelled by Advisor",
      body: "Your relationship with your advisor deteriorated beyond repair. They requested the department formally remove you from the PhD program."
    },
    compExamFail: {
      icon: "📋",
      color: C.blue,
      title: "Comprehensive Exam Failed",
      body: "You failed the Comprehensive Examination twice. The department requires all doctoral students to pass the comp exam by November of Year 2. You have been removed from the program."
    }
  };
  const cfg = configs[reason] || configs.timeout;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "48px 24px",
      animation: "popIn .4s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 56,
      marginBottom: 12
    }
  }, cfg.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 26,
      fontWeight: 700,
      color: cfg.color,
      marginBottom: 12
    }
  }, cfg.title), /*#__PURE__*/React.createElement("div", {
    style: {
      background: cfg.color + "14",
      border: `1px solid ${cfg.color}44`,
      borderRadius: 12,
      padding: "16px 24px",
      marginBottom: 28,
      maxWidth: 380,
      margin: "0 auto 28px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: C.sub,
      fontSize: 13,
      lineHeight: 1.7
    }
  }, cfg.body)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.muted,
      marginBottom: 20
    }
  }, "Reached ", MONTH_NAMES[calMonIdx(s.month)], ", Year ", calYear(s.month), " (Month ", s.month, ")"), /*#__PURE__*/React.createElement(Btn, {
    onClick: onRestart,
    variant: "primary"
  }, "Try Again"));
}
function WinPanel({
  s,
  onRestart
}) {
  const C = useC();
  const year = calYear(s.month);
  const mon = MONTH_NAMES[calMonIdx(s.month)];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "40px 24px",
      animation: "popIn .4s ease",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(Confetti, null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 56,
      marginBottom: 12
    }
  }, "\uD83C\uDF93"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 24,
      fontWeight: 700,
      color: C.green,
      marginBottom: 8
    }
  }, "Congratulations, Dr. Scholar!"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: C.sub,
      fontSize: 13,
      marginBottom: 6
    }
  }, "Graduated in ", s.month, " months \u2014 ", mon, ", Year ", year), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.text,
      marginBottom: 24
    }
  }, s.pubHigh, " OPRE \xB7 ", s.pubMedian, " EJOR \xB7 ", s.pubLow, " COR"), /*#__PURE__*/React.createElement(Btn, {
    onClick: onRestart,
    variant: "primary"
  }, "Play Again"));
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

function PhDOdyssey() {
  const [s, setS] = useState(initialState());
  const [view, setView] = useState("game");
  const [ideaPopup, setIdeaPopup] = useState(false);
  const [breakthroughPopup, setBreakthroughPopup] = useState(null); // { projectId, rq } or null
  const [dark, setDark] = useState(false);
  const theme = dark ? DARK : LIGHT;
  const mainRef = useRef(null);

  // ── Event choice ──────────────────────────────────────────────────────────
  const handleEventChoice = opt => {
    setS(prev => {
      const ns = {
        ...prev
      };
      const map = {
        mentalHealth: 1,
        domainKnowledge: 1,
        academicReputation: 1,
        advisorRelation: 1
      };
      Object.entries(opt.effects).forEach(([k, v]) => {
        if (k === "money") {
          ns.money = (ns.money || 0) + v;
          if (v !== 0) ns.monthSpending = [...(ns.monthSpending || []), {
            label: v > 0 ? `💰 ${prev.currentEvent?.title || "Event"} (income)` : `💸 ${prev.currentEvent?.title || "Event"} (expense)`,
            amount: v
          }];
        } else if (map[k]) ns[k] = clamp(ns[k] + v);
      });
      // TA flag: research blocked this month
      if (opt.setTA) ns.taDoneThisMonth = true;
      ns.log = [`📌 "${prev.currentEvent.title}" — ${opt.consequence}`, ...ns.log];
      if (ns.mentalHealth <= 0) return {
        ...ns,
        phase: "gameOver",
        gameOverReason: "mentalHealth"
      };
      if (ns.advisorRelation <= 0) return {
        ...ns,
        phase: "gameOver",
        gameOverReason: "advisorKick"
      };
      ns.phase = "workChoice";
      ns.currentEvent = null;
      return ns;
    });
  };

  // ── Work actions ──────────────────────────────────────────────────────────
  const handleWorkAction = key => {
    if (key === "study_comp_exam") {
      setS(prev => {
        if (prev.compExamPassed) return prev;
        const newSessions = (prev.compExamStudySessions || 0) + 1;
        const newChance = Math.min(Math.round((COMP_EXAM_BASE_CHANCE + newSessions * COMP_EXAM_STUDY_BONUS) * 100), 97);
        const ns = {
          ...prev,
          compExamStudySessions: newSessions,
          domainKnowledge: clamp(prev.domainKnowledge + 5),
          mentalHealth: clamp(prev.mentalHealth - 5),
          log: [`📋 Studied for comp exam (session ${newSessions}). Pass chance now ${newChance}%. +5 knowledge.`, ...prev.log]
        };
        return tickMonth(ns).state;
      });
      return;
    }
    if (key === "research") {
      setS(p => ({
        ...p,
        phase: "research"
      }));
      return;
    }
    if (key === "new_project") {
      setS(prev => {
        if (!canGraduate || hasActiveWork(prev) && prev.ideas === 0) return prev;
        if (prev.ideas === 0) return prev;
        const id = `Project ${prev.projects.length + 1}`;
        return {
          ...prev,
          ideas: prev.ideas - 1,
          projects: [...prev.projects, {
            id,
            progress: 0,
            solved: false,
            monthsSpent: 0
          }],
          activeProject: id,
          phase: "research",
          log: [`💡 Used 1 idea → started ${id}. Ideas left: ${prev.ideas - 1}`, ...prev.log]
        };
      });
      return;
    }
    if (key === "read_papers") {
      setS(prev => {
        const gotIdea = Math.random() < 0.10;
        if (gotIdea) setTimeout(() => setIdeaPopup(true), 50);
        const ns = {
          ...prev,
          domainKnowledge: clamp(prev.domainKnowledge + 5),
          mentalHealth: clamp(prev.mentalHealth - 5),
          ideas: prev.ideas + (gotIdea ? 1 : 0),
          log: [`📚 Read papers: +5 knowledge, -5 mood.${gotIdea ? " 💡 New idea!" : " (no new idea)"}`, ...prev.log]
        };
        return tickMonth(ns).state;
      });
      return;
    }
    if (key === "apply_informs") {
      setS(prev => {
        const ns = {
          ...prev,
          informsApplied: true,
          log: [`🏆 INFORMS abstract submitted! Announcement in August.`, ...prev.log]
        };
        return tickMonth(ns).state;
      });
      return;
    }
    if (key === "apply_nsf") {
      setS(prev => {
        const chance = nsfChance(prev);
        const ns = {
          ...prev,
          nsfApplied: true,
          mentalHealth: clamp(prev.mentalHealth - 8),
          log: [`🏅 NSF Fellowship application submitted! Results in May. Win chance: ${Math.round(chance * 100)}% (based on your publications). Award: $10,000 one-time.`, ...prev.log]
        };
        return tickMonth(ns).state;
      });
      return;
    }
    if (key.startsWith("write::")) {
      const projId = key.split("::")[1];
      setS(prev => {
        const proj = prev.projects.find(p => p.id === projId);
        if (!proj?.solved) return prev;
        const paperId = `Paper ${prev.papers.length + 1}`;
        const rq = Math.min(Math.round(proj.solvedKnowledge ?? prev.domainKnowledge), 100);
        const paper = {
          id: paperId,
          projectId: projId,
          rq,
          // research quality — locked in from domain knowledge at solve time
          wq: 0,
          // writing quality — accumulates during writing phase
          monthsWriting: 0,
          status: "writing",
          journal: null,
          rejectedFrom: [],
          revisionCount: 0,
          advisorLevel: null,
          pendingJournal: null
        };
        return {
          ...prev,
          papers: [...prev.papers, paper],
          writingPaperId: paperId,
          submittedCount: prev.submittedCount + 1,
          phase: "writing",
          log: [`✍️ Started writing ${paperId} (RQ:${rq})`, ...prev.log]
        };
      });
      return;
    }
    if (key === "continue_writing") {
      setS(p => ({
        ...p,
        phase: "writing"
      }));
      return;
    }
    if (key === "thesis") {
      setS(prev => {
        const ns = {
          ...prev,
          thesisStarted: true,
          log: [`📖 Thesis writing begun…`, ...prev.log]
        };
        return tickMonth(ns).state;
      });
      return;
    }
    if (key === "rest") {
      setS(prev => {
        const ns = {
          ...prev,
          mentalHealth: clamp(prev.mentalHealth + 10),
          log: [`🛋️ Rested this month. Mental health +10.`, ...prev.log]
        };
        return tickMonth(ns).state;
      });
      return;
    }
    if (key.startsWith("leisure::")) {
      const actId = key.split("::")[1];
      const act = LEISURE_ACTIVITIES.find(a => a.id === actId);
      if (!act) return;
      setS(prev => {
        if (prev.money < act.cost) return prev;
        const ns = {
          ...prev,
          money: prev.money - act.cost,
          mentalHealth: clamp(prev.mentalHealth + act.mhGain),
          monthSpending: [...(prev.monthSpending || []), {
            label: act.label,
            amount: -act.cost
          }],
          log: [`${act.label}: -$${act.cost}, mental health +${act.mhGain}. ${act.desc}`, ...prev.log]
        };
        return tickMonth(ns).state;
      });
      return;
    }
    if (key.startsWith("submit::")) {
      const [, paperId, journal] = key.split("::");
      setS(prev => {
        const paper = prev.papers.find(p => p.id === paperId);
        if (!paper) return prev;
        // Check eligibility
        const req = JOURNAL_REQS[journal];
        if ((paper.rq || 0) < req.rq || (paper.wq || 0) < req.wq) return prev; // blocked
        const papers = prev.papers.map(p => p.id !== paperId ? p : {
          ...p,
          status: "under_review",
          journal
        });
        const rt = JOURNALS[journal].reviewTime;
        const ns = {
          ...prev,
          papers,
          journalReviews: [...prev.journalReviews, {
            paperId,
            journal,
            monthsLeft: rt,
            revisionCount: paper.revisionCount || 0
          }],
          log: [`📬 ${paperId} → ${journal} (RQ:${paper.rq} WQ:${paper.wq}). Review in ~${rt} months.`, ...prev.log]
        };
        return tickMonth(ns).state;
      });
      return;
    }
    if (key.startsWith("revise::")) {
      const paperId = key.split("::")[1];
      setS(prev => {
        const wqGain = Math.floor(Math.random() * 21); // 0–20 writing improvement
        const papers = prev.papers.map(p => {
          if (p.id !== paperId) return p;
          return {
            ...p,
            wq: Math.min((p.wq || 0) + wqGain, 100),
            status: "advisor_approved"
          };
        });
        const updated = papers.find(p => p.id === paperId);
        const ns = {
          ...prev,
          papers,
          log: [`🔧 Revised ${paperId}: WQ → ${updated.wq} (+${wqGain}) · ready to resubmit.`, ...prev.log]
        };
        return tickMonth(ns).state;
      });
      return;
    }
  };

  // ── Research ──────────────────────────────────────────────────────────────
  const handleResearch = () => {
    setS(prev => {
      if (!prev.activeProject) return prev;
      const idx = prev.projects.findIndex(p => p.id === prev.activeProject);
      if (idx === -1) return prev;
      const eff = prev.mentalHealth / 100 * (0.5 + prev.domainKnowledge / 200);
      const gain = Math.round(10 + eff * 15 + Math.random() * 10);
      let solvedKnowledge = prev.domainKnowledge;
      const projects = prev.projects.map((p, i) => {
        if (i !== idx) return p;
        const np = Math.min(p.progress + gain, 200);
        let solved = p.solved;
        if (!solved && np > 100 && Math.random() < (np - 100) / 200) {
          solved = true;
          solvedKnowledge = prev.domainKnowledge;
        }
        return {
          ...p,
          progress: np,
          solved,
          solvedKnowledge: solved ? solvedKnowledge : p.solvedKnowledge,
          monthsSpent: (p.monthsSpent || 0) + 1
        };
      });
      const proj = projects[idx];
      const solMsg = proj.solved ? " 🎯 SOLVED!" : "";
      let extraLog = [];
      let nsExtra = {};
      if (proj.solved && !prev.projects[idx].solved) {
        // Project just got solved: domain knowledge → 0, absorbed into research depth
        extraLog = [`🧠 Domain knowledge consumed into research breakthrough. Knowledge reset to 0.`];
        nsExtra = {
          domainKnowledge: 0
        };
        setTimeout(() => setBreakthroughPopup({
          projectId: proj.id,
          rq: Math.min(Math.round(solvedKnowledge), 100)
        }), 50);
      }
      const ns = {
        ...prev,
        ...nsExtra,
        projects,
        log: [`🔬 ${prev.activeProject}: month ${proj.monthsSpent}.${solMsg}`, ...extraLog, ...prev.log]
      };
      return tickMonth(ns).state;
    });
  };

  // ── Writing ───────────────────────────────────────────────────────────────
  const handleDevoteWriting = () => {
    setS(prev => {
      const idx = prev.papers.findIndex(p => p.id === prev.writingPaperId);
      if (idx === -1) return prev;
      const wqGain = Math.floor(Math.random() * 21); // 0–20 each month
      const papers = prev.papers.map((p, i) => i !== idx ? p : {
        ...p,
        wq: Math.min((p.wq || 0) + wqGain, 100),
        monthsWriting: p.monthsWriting + 1
      });
      const updated = papers[idx];
      const ns = {
        ...prev,
        papers,
        log: [`✍️ Writing ${updated.id}: WQ → ${updated.wq} (+${wqGain}) · RQ:${updated.rq}.`, ...prev.log]
      };
      return tickMonth(ns).state;
    });
  };
  const handleSubmitAdvisor = () => {
    setS(prev => {
      const idx = prev.papers.findIndex(p => p.id === prev.writingPaperId);
      if (idx === -1) return prev;
      const papers = prev.papers.map((p, i) => i !== idx ? p : {
        ...p,
        status: "advisor_review"
      });
      const ns = {
        ...prev,
        papers,
        writingPaperId: null,
        pendingAdvisorReview: {
          paperId: papers[idx].id,
          monthsLeft: 1
        },
        log: [`📨 Submitted ${papers[idx].id} to advisor.`, ...prev.log]
      };
      return tickMonth(ns).state;
    });
  };

  // ── Abolish paper ─────────────────────────────────────────────────────────
  const handleAbolishPaper = paperId => {
    setS(prev => {
      // Remove the paper, free the project slot (mark associated project papers as cleared)
      const papers = prev.papers.filter(p => p.id !== paperId);
      // If the abolished paper was tied to a project, allow that project to be written again
      // by removing from papers list — writableProjects will pick it up again
      return {
        ...prev,
        papers,
        writingPaperId: prev.writingPaperId === paperId ? null : prev.writingPaperId,
        submittedCount: Math.max(0, prev.submittedCount - 1),
        phase: "workChoice",
        log: [`🗑 Abolished ${paperId}. The project can be written again.`, ...prev.log]
      };
    });
  };

  // ── Career ────────────────────────────────────────────────────────────────
  const handleCareer = choice => {
    const hasHigh = s.pubHigh >= 1;
    const hasPostdoc = hasHigh || s.pubMedian >= 2;
    const qual = choice === "industry" ? true : choice === "postdoc" ? hasPostdoc : hasHigh;
    const msgs = {
      academic: "🏛️ Congratulations! You secured a tenure-track faculty position!",
      postdoc: "🔬 Excellent! You got a postdoc at a top university!",
      industry: "💼 You join a prestigious consulting firm."
    };
    if (qual) setS(p => ({
      ...p,
      phase: "win",
      log: [msgs[choice], ...p.log]
    }));
  };

  // ── Dismiss welcome → show first finance letter ───────────────────────────
  const handleWelcomeStart = () => {
    setS(p => ({
      ...p,
      phase: "letters",
      pendingLetters: [{
        type: "finance_summary",
        salary: MONTHLY_SALARY,
        expenses: MONTHLY_EXPENSES,
        balance: p.money,
        nsfBonus: 0
      }]
    }));
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  // ── Dismiss letters → proceed to event phase ─────────────────────────────
  const handleDismissLetters = () => {
    setS(p => ({
      ...p,
      phase: "event",
      pendingLetters: []
    }));
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const renderMain = () => {
    if (s.phase === "welcome") return /*#__PURE__*/React.createElement(WelcomePanel, {
      onStart: handleWelcomeStart
    });
    if (s.phase === "letters") return /*#__PURE__*/React.createElement(LettersPanel, {
      s: s,
      onDismiss: handleDismissLetters
    });
    if (s.phase === "event" && s.currentEvent) return /*#__PURE__*/React.createElement(EventPanel, {
      s: s,
      onChoice: handleEventChoice
    });
    if (s.phase === "workChoice") return /*#__PURE__*/React.createElement(WorkChoicePanel, {
      s: s,
      onAction: handleWorkAction
    });
    if (s.phase === "research") return /*#__PURE__*/React.createElement(ResearchPanel, {
      s: s,
      onResearch: handleResearch,
      onBack: () => setS(p => ({
        ...p,
        phase: "workChoice"
      }))
    });
    if (s.phase === "writing") return /*#__PURE__*/React.createElement(WritingPanel, {
      s: s,
      onDevote: handleDevoteWriting,
      onSubmitAdvisor: handleSubmitAdvisor,
      onBack: () => setS(p => ({
        ...p,
        phase: "workChoice"
      })),
      onAbolish: handleAbolishPaper
    });
    if (s.phase === "career") return /*#__PURE__*/React.createElement(CareerPanel, {
      s: s,
      onChoose: handleCareer
    });
    if (s.phase === "gameOver") return /*#__PURE__*/React.createElement(GameOverPanel, {
      s: s,
      onRestart: () => setS(initialState())
    });
    if (s.phase === "win") return /*#__PURE__*/React.createElement(WinPanel, {
      s: s,
      onRestart: () => setS(initialState())
    });
    return /*#__PURE__*/React.createElement("div", {
      style: {
        color: C.sub
      }
    }, "Loading\u2026");
  };
  return /*#__PURE__*/React.createElement(ThemeCtx.Provider, {
    value: theme
  }, /*#__PURE__*/React.createElement("style", null, makeGlobalStyles(theme)), ideaPopup && /*#__PURE__*/React.createElement(IdeaPopup, {
    onDismiss: () => setIdeaPopup(false)
  }), breakthroughPopup && /*#__PURE__*/React.createElement(BreakthroughPopup, {
    projectId: breakthroughPopup.projectId,
    rq: breakthroughPopup.rq,
    onDismiss: () => setBreakthroughPopup(null)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: dark ? `radial-gradient(ellipse at 30% 0%, #1e1640 0%, ${theme.bg} 55%)` : `radial-gradient(ellipse at 30% 0%, #ece8f8 0%, ${theme.bg} 55%)`,
      fontFamily: "'DM Mono',monospace",
      color: theme.text,
      padding: "20px 16px 48px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      textAlign: "center",
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Lora',serif",
      fontSize: 28,
      fontWeight: 700,
      color: theme.text
    }
  }, "PhD Odyssey"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: theme.muted,
      letterSpacing: 4,
      marginTop: 3
    }
  }, "OPERATIONS RESEARCH \xB7 SIMULATION"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDark(d => !d),
    title: dark ? "Switch to Light Mode" : "Switch to Dark Mode",
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      background: dark ? theme.surfaceAlt : theme.surface,
      border: `1.5px solid ${theme.border}`,
      borderRadius: 20,
      padding: "6px 12px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11,
      fontWeight: 600,
      color: theme.sub,
      fontFamily: "'DM Mono',monospace",
      boxShadow: dark ? "0 2px 8px rgba(0,0,0,.4)" : "0 2px 6px rgba(0,0,0,.08)",
      transition: "all .2s ease"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, dark ? "☀️" : "🌙"), /*#__PURE__*/React.createElement("span", null, dark ? "Light" : "Dark"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 18,
      maxWidth: 960,
      margin: "0 auto",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    s: s,
    view: view,
    setView: setView,
    onQuit: () => setS(initialState())
  }), /*#__PURE__*/React.createElement("div", {
    ref: mainRef,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 0
    }
  }, !["welcome", "gameOver", "win"].includes(s.phase) && /*#__PURE__*/React.createElement(RecentLog, {
    log: s.log
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: theme.surface,
      borderRadius: 14,
      padding: "22px 24px",
      border: `1px solid ${theme.border}`,
      minHeight: 440,
      maxHeight: "75vh",
      overflowY: "auto"
    }
  }, view === "game" && renderMain(), view === "papers" && /*#__PURE__*/React.createElement(PapersTab, {
    s: s
  }), view === "log" && /*#__PURE__*/React.createElement(LogTab, {
    s: s
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 16,
      fontSize: 9,
      color: theme.muted
    }
  }, "PhD Odyssey \xB7 Survive 6 years \xB7 Graduate \xB7 Find your path \xB7 Operations Research")));
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(PhDOdyssey));