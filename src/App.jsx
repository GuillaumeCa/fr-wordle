import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { WORDS } from "./words";

const startDate = new Date(2022, 0, 1, 0, 0, 0, 0);

const GREEN = "#4aab4a";
const YELLOW = "#bfa700";
const GREY = "#555";

let date = new Date(2022, 0, 23, 23, 59, 0, 0);
function init() {
  const dbg_date_str = localStorage.getItem("dbg_date");
  if (dbg_date_str) {
    date = new Date(parseInt(dbg_date_str));
  } else {
    localStorage.setItem("dbg_date", "" + date.getTime());
  }

  setInterval(() => {
    date.setSeconds(date.getSeconds() + 1);
    //console.log(date);
    localStorage.setItem("dbg_date", "" + date.getTime());
  }, 1000);
}

// init();

const getDate = () => {
  return new Date();
  // return new Date(date.getTime());
};

function usePrevious(value) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function useFirstRender() {
  const ref = useRef(true);
  useEffect(() => {
    ref.current = false;
  }, []);
  return ref.current;
}

function loop(num) {
  const cells = [];
  for (let i = 0; i < num; i++) {
    cells.push("");
  }
  return cells;
}

function setAnim(node, name, durationMs) {
  node.style.animationName = name;
  node.style.animationDuration = durationMs + "ms";
}

function clearAnim(node) {
  node.style.animationName = null;
  node.style.animationDuration = null;
}

function saveState(data, key = "data") {
  localStorage.setItem(key, JSON.stringify(data));
}

function restoreState(key = "data") {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    console.error("could not restore state", e.message);
  }
}

function isInDic(word) {
  return WORDS.includes(word);
}

function Cell({ letter, locked, index, color }) {
  const cellRef = useRef(null);
  const firstRender = useFirstRender();
  const previousLetter = usePrevious(letter);

  useEffect(() => {
    const cell = cellRef.current;
    if (letter !== "" && previousLetter !== letter && !firstRender) {
      setAnim(cell, "pop", 100);
    } else {
      clearAnim(cell);
    }
  });

  return (
    <div
      className="cell-wrap"
      style={locked ? { transitionDelay: index * 300 + "ms" } : null}
    >
      <div
        ref={cellRef}
        className="cell"
        style={{
          border: letter === "" ? "2px solid " + GREY : "2px solid #888",
          backgroundColor: null,
        }}
      >
        {letter}
      </div>
      <div
        className="cell cell-back"
        style={{
          border: null,
          backgroundColor: color,
        }}
      >
        {letter}
      </div>
    </div>
  );
}

function Board({ attempts, currentAttempt, getLetterColor, shake }) {
  return (
    <div className="board">
      {attempts.map((attempt, attemptIdx) => {
        const attempted = attempt.length === 5 && currentAttempt > attemptIdx;
        const shakeCurrent = currentAttempt === attemptIdx && shake;
        return (
          <div
            key={attemptIdx}
            className={`row ${attempted ? "attempted" : ""} ${
              shakeCurrent ? "shake" : ""
            }`}
          >
            {loop(5).map((letter, i) => {
              return (
                <Cell
                  key={i}
                  index={i}
                  locked={attempted}
                  color={getLetterColor(attempt, i)}
                  letter={attempt[i] || letter}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function KeyBoardButton({ label, onKey, color }) {
  return (
    <button
      style={{ backgroundColor: color }}
      className="keyboard-btn"
      onClick={() => onKey(label)}
    >
      {label}
    </button>
  );
}

function KeyboardRow({ letters, last = false, onKey, getKeyColor }) {
  return (
    <div>
      {last && <KeyBoardButton label="ENTRE" onKey={onKey} />}
      {letters.split("").map((letter) => (
        <KeyBoardButton
          key={letter}
          label={letter.toUpperCase()}
          onKey={onKey}
          color={getKeyColor(letter.toUpperCase())}
        />
      ))}
      {last && <KeyBoardButton label="SUPPR" onKey={onKey} />}
    </div>
  );
}

function Keyboard({ onKey, getKeyColor }) {
  return (
    <div className="keyboard">
      <KeyboardRow
        letters="azertyuiop"
        getKeyColor={getKeyColor}
        onKey={onKey}
      />
      <KeyboardRow
        letters="qsdfghjklm"
        getKeyColor={getKeyColor}
        onKey={onKey}
      />
      <KeyboardRow
        letters="wxcvbn"
        getKeyColor={getKeyColor}
        last={true}
        onKey={onKey}
      />
    </div>
  );
}

function Modal({ win, secret }) {
  const [remainDate, setRemainDate] = useState("00:00:00");

  function computeRemainDate() {
    const nextDay = getDate();
    nextDay.setDate(getDate().getDate() + 1);
    const nextWordTime = nextDay.setHours(0, 0, 0) - getDate();
    const hours = Math.floor(
      (nextWordTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((nextWordTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((nextWordTime % (1000 * 60)) / 1000);
    setRemainDate(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`
    );
  }

  useEffect(() => {
    computeRemainDate();
    const ref = setInterval(computeRemainDate, 1000);
    return () => clearInterval(ref);
  }, []);

  let msg = (
    <h2>
      Bravo ! <br /> Vous avez gagné 🥳 Le mot était bien {secret}
    </h2>
  );

  if (!win) {
    msg = (
      <h2>
        Perdu ! <br /> Tentez votre chance la prochaine fois 😕 Le mot était{" "}
        {secret}
      </h2>
    );
  }

  return (
    <div className="modal-container">
      <div className="modal">
        {msg}
        <p>Le prochain mot sera disponible dans {remainDate}</p>
      </div>
    </div>
  );
}

export default function App() {
  const secret = useMemo(() => {
    const now = getDate().setHours(0, 0, 0, 0);
    const diff = (now - startDate) * 18346e3;
    return WORDS[diff % WORDS.length];
  }, []);

  const [attempts, setAttempt] = useState(["", "", "", "", "", ""]);
  const [currentAttempt, setCurrentAttempt] = useState(0);

  const [restoring, setRestore] = useState(true);
  const [revealing, setReveal] = useState(false);
  const [shake, setShake] = useState(false);

  const hasWon = attempts.some(
    (attempt, i) => secret === attempt && currentAttempt > i
  );
  const hasLost = attempts.every(
    (attempt) =>
      attempt !== secret && attempt.length === 5 && currentAttempt > 5
  );

  // restore state when loading app
  useEffect(() => {
    const date = restoreState("date");
    const now = getDate().setHours(0, 0, 0, 0);
    // restore previous attempt only if day is the same
    if (date && date === now) {
      const saved = restoreState();
      if (saved) {
        setReveal(true);
        setAttempt(saved.attempts);
        setCurrentAttempt(saved.currentAttempt);
      }
    }
    setRestore(false);
    saveState(now, "date");
  }, []);

  // save game state
  useEffect(() => {
    if (!restoring) {
      saveState({
        attempts: attempts.map((attempt) => {
          return attempt.length === 5 && isInDic(attempt) ? attempt : "";
        }),
        currentAttempt,
      });
    }
  }, [restoring, attempts, currentAttempt]);

  // handle inputs
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.shiftKey || e.metaKey || e.altKey || e.tabKey) {
        return;
      }

      const key = e.key.toUpperCase();
      handleKey(key);
    };
    document.body.addEventListener("keydown", onKeyDown);
    return () => document.body.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (currentAttempt !== 0) {
      setReveal(true);
      setTimeout(() => {
        setReveal(false);
      }, 5 * 300 + 500);
    } else {
      setReveal(false);
    }
  }, [currentAttempt]);

  function updateAttempt(newValue) {
    setAttempt(
      attempts.map((attempt, i) => {
        if (i === currentAttempt) {
          return newValue;
        }
        return attempt;
      })
    );
  }

  function handleKey(key) {
    if (revealing || hasWon || hasLost) {
      return;
    }

    if (key === "BACKSPACE" || key === "SUPPR") {
      let newAttempt = attempts[currentAttempt];
      newAttempt = newAttempt.slice(0, newAttempt.length - 1);
      updateAttempt(newAttempt);
      return;
    }

    if (key === "ENTER" || key === "ENTRE") {
      if (!isInDic(attempts[currentAttempt])) {
        setShake(true);
        setTimeout(() => {
          alert("Ce mot n'existe pas dans le dictionnaire");
          setShake(false);
        }, 10);
        return;
      }

      setCurrentAttempt((c) => c + 1);
      return;
    }

    if (key.length === 1 && /[A-Z]/.test(key)) {
      const newAttempt = attempts[currentAttempt] + key;
      if (newAttempt.length > 5) {
        return;
      }
      updateAttempt(newAttempt);
    }
  }

  function getLetterColor(word, letterIdx) {
    if (letterIdx !== -1) {
      const isInWord = secret.indexOf(word[letterIdx]) !== -1;

      // check if all letters have been correctly placed
      const allFound =
        secret
          .split("")
          .filter(
            (letter, i) =>
              letterIdx !== i &&
              letter !== word[i] &&
              letter === word[letterIdx]
          ).length === 0;
      const isAtLocation = secret[letterIdx] === word[letterIdx];

      if (isAtLocation) {
        return GREEN;
      } else if (!allFound && isInWord) {
        return YELLOW;
      } else {
        return GREY;
      }
    }

    return null;
  }

  function getKeyColor(key) {
    if (currentAttempt === 0) {
      return null;
    }

    if (revealing) {
      if (restoring) {
        return null;
      }

      if (currentAttempt <= 1) {
        return null;
      }
    }

    const attemptsToCheck = attempts.slice(0, currentAttempt);
    let color = null;
    attemptsToCheck.forEach((word) => {
      const newColor = getLetterColor(word, word.indexOf(key));
      if (newColor === null) {
        return;
      }

      if (color === null && newColor !== color) {
        color = newColor;
      }
      if (color === GREY && newColor !== GREY) {
        color = newColor;
      }
      if (color === YELLOW && newColor === GREEN) {
        color = newColor;
      }
    });

    return color;
  }

  return (
    <div className="App">
      <h1>LE MOT</h1>
      <hr />
      {(hasWon || hasLost) && !revealing && !restoring && (
        <Modal win={hasWon} secret={secret} />
      )}
      <Board
        attempts={attempts}
        currentAttempt={currentAttempt}
        getLetterColor={getLetterColor}
        shake={shake}
      />
      <Keyboard getKeyColor={getKeyColor} onKey={handleKey} />
    </div>
  );
}
