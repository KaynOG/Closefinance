import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSoundEnabled, onSoundChange, playTone, setSoundEnabled } from "@/lib/sound";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    setEnabled(isSoundEnabled());
    return onSoundChange(setEnabled);
  }, []);
  const label = enabled ? "Desativar som do app" : "Ativar som do app";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="floating-control size-9 rounded-xl border border-border hover:bg-muted hover:text-foreground"
      aria-label={label}
      aria-pressed={!enabled}
      title={label}
      data-no-sound
      onClick={() => {
        const next = !isSoundEnabled();
        setSoundEnabled(next);
        if (next) playTone("soft");
      }}
    >
      {enabled ? <Volume2 className="text-secondary" /> : <VolumeX className="text-muted-foreground" />}
    </Button>
  );
}