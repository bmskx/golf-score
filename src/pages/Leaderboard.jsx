import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function Leaderboard() {
    const [rows, setRows] = useState([]);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    async function load() {
        setErr("");
        setLoading(true);
        try {
            // API ที่เราจะทำ: ?op=leaderboard
            const data = await apiGet({ op: "leaderboard" });
            setRows(data.rows || []);
        } catch (e) {
            setErr(e.message || "โหลดไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Leaderboard</h1>
                <button className="px-4 py-2 rounded-lg border bg-white" onClick={load} disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>

            {err && <div className="text-sm text-red-600">{err}</div>}

            <div className="bg-white border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr className="text-left">
                            <th className="px-4 py-2 w-16">#</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2 w-24">Group</th>
                            <th className="px-4 py-2 w-24">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td className="px-4 py-6 text-gray-500" colSpan={4}>
                                    ยังไม่มีข้อมูล (หรือยังไม่ได้ตั้งค่า VITE_GS_API_URL)
                                </td>
                            </tr>
                        ) : (
                            rows.map((r, idx) => (
                                <tr key={`${r.playerId}-${idx}`} className="border-t">
                                    <td className="px-4 py-2">{idx + 1}</td>
                                    <td className="px-4 py-2">{r.name}</td>
                                    <td className="px-4 py-2">{r.groupId}</td>
                                    <td className="px-4 py-2 font-semibold">{r.total}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
