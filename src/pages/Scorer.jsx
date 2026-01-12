import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../services/api";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function Scorer() {
    const [groupId, setGroupId] = useState("");
    const [pin, setPin] = useState("");
    const [hole, setHole] = useState(1);

    const [players, setPlayers] = useState([]); // [{playerId,name,score}]
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState("");
    const [err, setErr] = useState("");

    const canLoad = groupId.trim().length > 0;
    const canSubmit = players.length > 0 && pin.trim().length > 0 && !loading;

    const [completedHoles, setCompletedHoles] = useState([]);

    const progress = useMemo(() => {
        const filled = players.filter((p) => p.score !== "" && p.score !== null && p.score !== undefined).length;
        return { filled, total: players.length };
    }, [players]);

    const availableHoles = useMemo(() => {
        const done = new Set(completedHoles);
        return Array.from({ length: 18 }, (_, i) => i + 1).filter(
            (h) => !done.has(h)
        );
    }, [completedHoles]);

    async function loadGroup(targetHole = hole) {
        setErr("");
        setLoading(true);
        try {
            const data = await apiGet({ op: "group", groupId: groupId.trim(), hole: targetHole });
            setCompletedHoles(data.completedHoles || []);
            const done = new Set(data.completedHoles || []);
            if (done.has(hole)) {
                const next = availableHoles[0];
                if (next) setHole(next);
            }
            setPlayers((data.players || []).map((p) => ({ ...p, score: p.score ?? "" })));
            setToast(`Loaded ${groupId.trim()} • Hole ${targetHole}`);
        } catch (e) {
            setErr(e.message || "Load failed");
        } finally {
            setLoading(false);
        }
    }

    function setScore(playerId, value) {
        if (value === "" || value === null || value === undefined) {
            setPlayers((prev) => prev.map((p) => (p.playerId === playerId ? { ...p, score: "" } : p)));
            return;
        }
        const n = Number(value);
        if (!Number.isFinite(n)) return;
        // ปรับช่วงได้ตามสนาม
        if (n < 1 || n > 20) return;

        setPlayers((prev) => prev.map((p) => (p.playerId === playerId ? { ...p, score: n } : p)));
    }

    function bumpScore(playerId, delta) {
        setPlayers((prev) =>
            prev.map((p) => {
                if (p.playerId !== playerId) return p;
                const cur = p.score === "" ? 0 : Number(p.score);
                const next = clamp((Number.isFinite(cur) ? cur : 0) + delta, 0, 20);
                return { ...p, score: next === 0 ? "" : next };
            })
        );
    }

    function prevHole() {
        const idx = availableHoles.indexOf(hole);
        if (idx > 0) {
            setHole(availableHoles[idx - 1]);
        }
    }

    function nextHole() {
        const idx = availableHoles.indexOf(hole);
        if (idx !== -1 && idx < availableHoles.length - 1) {
            setHole(availableHoles[idx + 1]);
        }
    }

    async function submitHole() {
        setErr("");
        setLoading(true);
        try {
            const payload = {
                op: "submitHole",
                groupId: groupId.trim(),
                pin: pin.trim(),
                hole,
                scores: players.map((p) => ({
                    playerId: p.playerId,
                    value: p.score === "" ? null : Number(p.score),
                })),
            };
            const res = await apiPost(payload);
            setToast(res.message || `Saved Hole ${hole}`);
            // reload fresh
            await loadGroup(hole);
        } catch (e) {
            setErr(e.message || "Save failed");
        } finally {
            setLoading(false);
        }
    }

    // toast auto-hide
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(""), 1800);
        return () => clearTimeout(t);
    }, [toast]);

    // เปลี่ยนหลุมแล้ว auto-load ถ้าเคยโหลดกลุ่มแล้ว
    useEffect(() => {
        if (!groupId.trim()) return;
        if (players.length === 0) return;
        loadGroup(hole);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hole]);

    return (
        <div className="space-y-4">
            {/* Sticky top controls (มือถือสะดวกมาก) */}
            <div className="sticky top-0 z-10 -mx-4 px-4 pt-3 pb-3 bg-gray-50/95 backdrop-blur border-b">
                <div className="max-w-5xl mx-auto space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="font-semibold">⛳ Scorer</div>
                        <div className="text-xs text-gray-600">
                            Filled: <span className="font-semibold">{progress.filled}/{progress.total}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                            <label className="text-xs font-medium text-gray-700">Group</label>
                            <input
                                className="mt-1 w-full border rounded-xl px-3 py-2 text-base"
                                placeholder="G01"
                                value={groupId}
                                onChange={(e) => setGroupId(e.target.value)}
                            />
                        </div>

                        <div className="col-span-5">
                            <label className="text-xs font-medium text-gray-700">PIN</label>
                            <input
                                className="mt-1 w-full border rounded-xl px-3 py-2 text-base"
                                placeholder="482913"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                            />
                        </div>

                        {/* Hole switch */}
                        <div className="col-span-12 flex items-center gap-2">
                            <button
                                className="h-11 w-11 rounded-xl border bg-white active:scale-[0.98]"
                                onClick={prevHole}
                                disabled={loading || availableHoles.indexOf(hole) <= 0}
                            >
                                ◀
                            </button>

                            <div className="h-11 px-4 rounded-xl border bg-white flex items-center justify-center font-semibold">
                                Hole {hole}
                            </div>

                            <button
                                className="h-11 w-11 rounded-xl border bg-white active:scale-[0.98]"
                                onClick={nextHole}
                                disabled={
                                    loading ||
                                    availableHoles.indexOf(hole) === -1 ||
                                    availableHoles.indexOf(hole) >= availableHoles.length - 1
                                }
                            >
                                ▶
                            </button>

                            <div className="flex-1" />

                            <button
                                className="h-11 px-4 rounded-xl bg-black text-white disabled:opacity-50 active:scale-[0.98]"
                                disabled={!canLoad || loading}
                                onClick={() => loadGroup(hole)}
                            >
                                {loading ? "Loading..." : "Load"}
                            </button>

                            <button
                                className="h-11 px-4 rounded-xl bg-green-600 text-white disabled:opacity-50 active:scale-[0.98]"
                                disabled={!canSubmit}
                                onClick={() => {
                                    const ok = confirm(`Confirm save • ${groupId.trim()} • Hole ${hole}?`);
                                    if (ok) submitHole();
                                }}
                            >
                                {loading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>

                    {err && <div className="text-sm text-red-600">{err}</div>}
                    {toast && (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                            {toast}
                        </div>
                    )}
                </div>
            </div>

            {/* Players cards (เหมาะมือถือ) */}
            {players.length === 0 ? (
                <div className="bg-white border rounded-2xl p-6 text-gray-500">
                    ใส่ Group แล้วกด Load เพื่อเริ่มกรอกคะแนน
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {players.map((p, idx) => (
                        <div key={p.playerId} className="bg-white border rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-gray-500">Player {idx + 1}</div>
                                    <div className="text-lg font-semibold">{p.name}</div>
                                </div>

                                {/* Quick +/- */}
                                <div className="flex items-center gap-2">
                                    <button
                                        className="h-11 w-11 rounded-xl border bg-white text-xl active:scale-[0.98]"
                                        onClick={() => bumpScore(p.playerId, -1)}
                                        disabled={loading}
                                    >
                                        −
                                    </button>

                                    {/* Big score box */}
                                    <input
                                        className="h-11 w-20 text-center border rounded-xl text-lg font-semibold"
                                        inputMode="numeric"
                                        placeholder="—"
                                        value={p.score === null ? "" : p.score}
                                        onChange={(e) => setScore(p.playerId, e.target.value)}
                                    />

                                    <button
                                        className="h-11 w-11 rounded-xl border bg-white text-xl active:scale-[0.98]"
                                        onClick={() => bumpScore(p.playerId, +1)}
                                        disabled={loading}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                                {[3, 4, 5, 6, 7].map((n) => (
                                    <button
                                        key={n}
                                        className={`flex-1 h-11 rounded-xl border active:scale-[0.98] ${Number(p.score) === n ? "bg-black text-white border-black" : "bg-white"
                                            }`}
                                        onClick={() => setScore(p.playerId, n)}
                                        disabled={loading}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-2 text-xs text-gray-500">
                                Tip: กดปุ่ม 3–7 เพื่อใส่เร็ว หรือใช้ +/−
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom space for mobile */}
            <div className="h-10" />
        </div>
    );
}
