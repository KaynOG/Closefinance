import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { getRank } from "@/lib/ranks";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { Users, UserPlus, Copy, Check, Trash2, Trophy, Search } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  avatar: string | null;
  total_points: number;
  friend_code: string;
}

export function FriendsRanking({ myPoints }: { myPoints: number }) {
  const [, , user] = useStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_my_friends_ranking");
    if (!error && data) setFriends(data as Friend[]);
    setLoading(false);
  }

  useEffect(() => { if (user) load(); }, [user?.id]);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setMsg(null);
    const c = code.trim().toUpperCase();
    if (!c) return;
    if (user?.friendCode && c === user.friendCode) {
      setMsg({ type: "err", text: "Você não pode se adicionar." });
      return;
    }
    setAdding(true);
    const { data, error } = await supabase.rpc("find_profile_by_friend_code", { _code: c });
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      setMsg({ type: "err", text: "Código não encontrado." });
      setAdding(false);
      return;
    }
    const profile = Array.isArray(data) ? data[0] : data;
    const { error: insErr } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: profile.id,
    });
    if (insErr) {
      setMsg({ type: "err", text: insErr.code === "23505" ? "Esse amigo já está na sua lista." : "Não foi possível adicionar." });
    } else {
      setMsg({ type: "ok", text: `${profile.name} adicionado!` });
      setCode("");
      load();
    }
    setAdding(false);
  }

  async function removeFriend(friendId: string) {
    if (!user) return;
    await supabase.from("friendships").delete().eq("user_id", user.id).eq("friend_id", friendId);
    load();
  }

  function copyCode() {
    if (!user?.friendCode) return;
    navigator.clipboard?.writeText(user.friendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const myEntry = user ? { id: user.id, name: user.name + " (você)", avatar: user.avatar ?? null, total_points: myPoints, friend_code: user.friendCode ?? "", isMe: true } : null;

  const ranking = [...friends.filter(f => f.id !== user?.id).map(f => ({ ...f, isMe: false })), ...(myEntry ? [myEntry] : [])]
    .sort((a, b) => b.total_points - a.total_points || a.name.localeCompare(b.name, "pt-BR") || a.id.localeCompare(b.id));

  return (
    <GlassCard hideKey="missoes-friends" hideLabel="Ranking de amigos">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary"><Users className="size-4" /></div>
        <div>
          <h2 className="text-base font-semibold">Ranking de amigos</h2>
          <p className="text-[11px] font-mono text-muted-foreground">compartilhe seu código e compare pontos</p>
        </div>
      </div>

      {/* Meu código */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-4">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Seu código de amigo</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-xl font-bold tracking-widest text-primary">
            {user?.friendCode ?? "----"}
          </code>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-lg border border-border px-3 py-2 text-xs flex items-center gap-1.5 hover:bg-white/5 transition active:scale-95"
          >
            {copied ? <><Check className="size-3.5" /> Copiado</> : <><Copy className="size-3.5" /> Copiar</>}
          </button>
        </div>
      </div>

      {/* Adicionar amigo */}
      <form onSubmit={addFriend} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Código do amigo (ex: A2B7C9DE)"
            maxLength={12}
            className="w-full rounded-xl bg-white/5 border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white/10 transition font-mono uppercase tracking-wider"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !code.trim()}
          className="rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-2.5 text-sm flex items-center gap-1.5 glow-violet disabled:opacity-50"
        >
          <UserPlus className="size-4" /> Adicionar
        </button>
      </form>
      {msg && (
        <p className={`text-xs font-mono mb-3 ${msg.type === "ok" ? "text-[#7DF2C5]" : "text-[#FF8FA3]"}`}>{msg.text}</p>
      )}

      {/* Lista de amigos */}
      <SectionTitle title="Ranking" subtitle={loading ? "carregando…" : friends.length === 0 ? "adicione amigos para começar" : `${friends.length} amigo(s)`} />
      <ul className="space-y-2">
        {ranking.map((f, idx) => {
          const rank = getRank(f.total_points, f.isMe ? user?.gender : undefined);
          const RankIcon = rank.current.Icon;
          const position = idx + 1;
          return (
            <li key={f.id} data-ranking-points={f.total_points} aria-current={f.isMe ? "true" : undefined} className={`flex items-center gap-3 rounded-lg border p-3 ${f.isMe ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/30"}`}>
              <div className="w-6 text-center font-mono text-xs text-muted-foreground shrink-0">
                {position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : `#${position}`}
              </div>
              <div
                className="size-10 rounded-full overflow-hidden border-2 bg-[image:var(--gradient-primary)] grid place-items-center text-sm font-bold shrink-0"
                style={{ borderColor: rank.current.color, boxShadow: `0 0 10px ${rank.current.color}66` }}
              >
                {f.avatar ? <img src={f.avatar} alt={f.name} className="size-full object-cover" /> : f.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{f.name}</p>
                <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                  <RankIcon className="size-3" style={{ color: rank.current.color }} />
                  <span style={{ color: rank.current.color }}>{rank.displayName}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-bold text-sm flex items-center gap-1 justify-end">
                  <Trophy className="size-3.5 text-secondary" /> {f.total_points}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">pontos</p>
              </div>
              {!f.isMe && <button
                onClick={() => removeFriend(f.id)}
                title="Remover"
                className="rounded-lg p-1.5 text-muted-foreground hover:text-[#FF4D6D] hover:bg-white/5 shrink-0"
              >
                <Trash2 className="size-4" />
              </button>}
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}

