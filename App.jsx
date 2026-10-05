import React, { useState, useEffect } from "react";

// ------------------------------------------------------------------
// Skyjo — marcador de pontos
// Cada rodada: some as 12 cartas (-2 a 12) de cada jogador.
// Quem FECHA a rodada e não tiver a menor soma tem os pontos dobrados.
// Menor total no fim da partida vence. Placar salvo neste aparelho.
// ------------------------------------------------------------------

const COLORS = [
  "#e4342b", "#2f4da0", "#7fb728", "#ee7b22",
  "#3fa9e0", "#8e5aa8", "#e24e8e", "#f4c20d",
];

const KEY = "skyjo_state_v1";
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; }
  catch { return null; }
};
const saved = load();

export default function App() {
  const [screen, setScreen]   = useState(saved?.screen ?? "setup");
  const [players, setPlayers] = useState(saved?.players ?? []);   // {id,name,color}
  const [target, setTarget]   = useState(saved?.target ?? 100);
  const [round, setRound]     = useState(saved?.round ?? 1);
  const [history, setHistory] = useState(saved?.history ?? []);  // [{pts,doubled,closer}]

  // ephemeral (not persisted)
  const [draft, setDraft]     = useState("");
  const [entries, setEntries] = useState({}); // {id: "12"}
  const [closer, setCloser]   = useState(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ screen, players, target, round, history }));
  }, [screen, players, target, round, history]);

  const totalOf = (id) => history.reduce((s, r) => s + (r.pts[id] || 0), 0);

  // ---------- actions ----------
  const addPlayer = () => {
    const v = draft.trim();
    if (!v || players.length >= 8) { setDraft(""); return; }
    setPlayers([...players, { id: Date.now() + Math.random(), name: v, color: COLORS[players.length] }]);
    setDraft("");
  };
  const delPlayer = (id) =>
    setPlayers(players.filter((p) => p.id !== id).map((p, i) => ({ ...p, color: COLORS[i] })));

  const registerRound = () => {
    const raw = {};
    players.forEach((p) => {
      const n = parseInt(entries[p.id], 10);
      raw[p.id] = isNaN(n) ? 0 : n;
    });
    const minRaw = Math.min(...players.map((p) => raw[p.id]));
    const pts = {}, doubled = {};
    players.forEach((p) => {
      let s = raw[p.id];
      const isCloser = closer !== null && p.id === closer;
      const uniqueLow =
        raw[p.id] === minRaw && players.filter((q) => raw[q.id] === minRaw).length === 1;
      if (isCloser && !uniqueLow) { s *= 2; doubled[p.id] = true; }
      pts[p.id] = s;
    });
    const nextHistory = [...history, { pts, doubled, closer }];
    setHistory(nextHistory);
    setRound(round + 1);
    setEntries({});
    setCloser(null);

    const totals = players.map((p) => nextHistory.reduce((s, r) => s + (r.pts[p.id] || 0), 0));
    if (totals.some((t) => t >= target)) setScreen("over");
  };

  const undo = () => {
    setHistory(history.slice(0, -1));
    setRound(Math.max(1, round - 1));
  };

  const newMatch = () => { setHistory([]); setRound(1); setEntries({}); setCloser(null); setScreen("game"); };
  const resetAll = () => {
    setPlayers([]); setTarget(100); setHistory([]); setRound(1);
    setEntries({}); setCloser(null); setDraft(""); setScreen("setup");
  };

  // ---------- screens ----------
  if (screen === "setup") {
    return (
      <>
        <Header />
        <div className="wrap">
          <div className="card-box">
            <h2>Jogadores</h2>
            <div className="addrow">
              <input
                type="text" maxLength={14} placeholder="Nome do jogador"
                autoComplete="off" value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              />
              <button className="btn" onClick={addPlayer}>+</button>
            </div>

            <ul className="plist">
              {players.length === 0 && <li className="empty">Adicione pelo menos 2 jogadores</li>}
              {players.map((p) => (
                <li key={p.id}>
                  <span className="chip" style={{ background: p.color }} />
                  <span className="pname">{p.name}</span>
                  <button className="x" onClick={() => delPlayer(p.id)}>✕</button>
                </li>
              ))}
            </ul>

            <div className="target">
              <div><strong>Partida termina em</strong><br />
                <span className="muted" style={{ fontSize: 13 }}>pontos para encerrar</span></div>
              <div className="stepper">
                <button onClick={() => setTarget(Math.max(20, target - 10))}>−</button>
                <span className="val">{target}</span>
                <button onClick={() => setTarget(Math.min(300, target + 10))}>+</button>
              </div>
            </div>
          </div>

          <button
            className="btn"
            style={players.length < 2 ? { opacity: 0.45, pointerEvents: "none" } : undefined}
            onClick={() => players.length >= 2 && setScreen("game")}
          >Começar partida</button>

          <details className="rules">
            <summary>Como funciona a pontuação</summary>
            <ul>
              <li>Cada carta vale de <strong>−2 a 12</strong>. O objetivo é somar o <strong>menor total</strong>.</li>
              <li>No fim de cada rodada, digite a <strong>soma das 12 cartas</strong> de cada jogador (pode ser negativa).</li>
              <li>Marque com 🁢 quem <strong>fechou</strong> a rodada. Se essa pessoa <strong>não</strong> tiver a menor soma, o app <strong>dobra</strong> os pontos dela.</li>
              <li>Colunas de 3 cartas iguais somem — é só não contar na soma que você digita.</li>
              <li>Quando alguém chega em {target}, a partida acaba e vence o <strong>menor total</strong>.</li>
            </ul>
          </details>
        </div>
      </>
    );
  }

  if (screen === "game") {
    const totals = {}; players.forEach((p) => (totals[p.id] = totalOf(p.id)));
    const min = Math.min(...players.map((p) => totals[p.id]));
    return (
      <>
        <Header />
        <div className="wrap">
          <div className="totals">
            {players.map((p) => {
              const t = totals[p.id];
              return (
                <div key={p.id}
                  className={`pcard ${t === min ? "leader" : ""} ${t >= target ? "danger" : ""}`}
                  style={{ background: p.color }}>
                  <div className="nm">{p.name}</div>
                  <div className="tot">{t}</div>
                  <div className="lead">{t === min ? "na frente" : ""}</div>
                </div>
              );
            })}
          </div>

          <div className="card-box">
            <div className="roundhd">
              <h2>Rodada {round}</h2>
              <span className="muted" style={{ fontSize: 13 }}>soma das cartas</span>
            </div>
            <p className="hint">Digite a soma de cada um. Toque em 🁢 para marcar quem fechou.</p>

            <div className="entry">
              <div className="erow">
                <span className="edot" style={{ visibility: "hidden" }} />
                <span className="elabel" /><span className="spacer" />
                <span className="closerhd">fechou</span>
              </div>
              {players.map((p) => (
                <div className="erow" key={p.id}>
                  <span className="edot" style={{ background: p.color }} />
                  <span className="elabel">{p.name}</span>
                  <input
                    className="escore" type="number" inputMode="numeric" placeholder="0"
                    value={entries[p.id] ?? ""}
                    onChange={(e) => setEntries({ ...entries, [p.id]: e.target.value })}
                  />
                  <button
                    className={`closer ${closer === p.id ? "on" : ""}`}
                    onClick={() => setCloser(closer === p.id ? null : p.id)}
                  >🁢</button>
                </div>
              ))}
            </div>

            <div className="btnrow">
              {history.length > 0 &&
                <button className="btn alt small" style={{ flex: 1 }} onClick={undo}>↩ Desfazer</button>}
              <button className="btn" style={{ flex: 2 }} onClick={registerRound}>Registrar rodada</button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="hist">
              <h2 style={{ fontSize: 18 }}>Rodadas</h2>
              <table className="htable">
                <thead>
                  <tr><th>#</th>{players.map((p) => <th key={p.id}>{p.name.slice(0, 6)}</th>)}</tr>
                </thead>
                <tbody>
                  {history.map((r, i) => (
                    <tr key={i}>
                      <td className="rn">{i + 1}</td>
                      {players.map((p) => (
                        <td key={p.id} className={r.doubled[p.id] ? "dbl" : ""}>{r.pts[p.id] ?? 0}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="sum">
                    <td className="rn">Σ</td>
                    {players.map((p) => <td key={p.id}>{totalOf(p.id)}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="foot">
            <button className="link" onClick={() => setScreen("over")}>Encerrar partida agora</button>
          </div>
        </div>
      </>
    );
  }

  // ----- game over -----
  const ranked = players.map((p) => ({ ...p, total: totalOf(p.id) })).sort((a, b) => a.total - b.total);
  return (
    <>
      <Header />
      <div className="wrap">
        <div className="card-box" style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: 2 }}>Fim de jogo</h2>
          <p className="muted" style={{ marginTop: 0 }}>Menor pontuação vence</p>
          <ol className="rank">
            {ranked.map((p, i) => (
              <li key={p.id} className={i === 0 ? "win" : ""}>
                <span className="pos">{i + 1}º</span>
                <span className="rname">
                  <span className="chip" style={{ background: p.color, width: 22, height: 30 }} />
                  {p.name} {i === 0 && <span className="crown">👑</span>}
                </span>
                <span className="rtot" style={{ color: p.color }}>{p.total}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="btnrow">
          <button className="btn alt" style={{ flex: 1 }} onClick={newMatch}>
            Nova partida<br /><small className="muted" style={{ fontWeight: 600 }}>mesmos jogadores</small>
          </button>
          <button className="btn danger" style={{ flex: 1 }} onClick={resetAll}>Recomeçar do zero</button>
        </div>
      </div>
    </>
  );
}

function Header() {
  return (
    <header>
      <h1 className="logo">SKYJO</h1>
      <p className="tag">Marcador de pontos</p>
    </header>
  );
}
