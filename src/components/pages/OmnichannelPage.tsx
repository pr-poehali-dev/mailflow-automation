import { useState } from "react";
import { CHANNELS } from "./omnichannel/channels";
import { OmniStats } from "./omnichannel/OmniStats";
import { CascadeBuilder } from "./omnichannel/CascadeBuilder";
import { ChannelsGrid } from "./omnichannel/ChannelsGrid";

export function OmnichannelPage() {
  const [selectedCascade, setSelectedCascade] = useState<string[]>(["email", "sms"]);

  const channels = CHANNELS;
  const totalSent = channels.reduce((s, c) => s + c.sent_today, 0);
  const connectedCount = channels.filter((c) => c.connected).length;

  const toggleCascade = (id: string) => {
    setSelectedCascade(selectedCascade.includes(id)
      ? selectedCascade.filter((x) => x !== id)
      : [...selectedCascade, id]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="fade-in-up flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Мультиканальные рассылки
            <span className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>НОВОЕ</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">8 каналов в одной платформе · единая статистика · каскадная отправка</p>
        </div>
      </div>

      <OmniStats
        connectedCount={connectedCount}
        totalChannels={channels.length}
        totalSent={totalSent}
      />

      <CascadeBuilder
        channels={channels}
        selectedCascade={selectedCascade}
        toggleCascade={toggleCascade}
      />

      <ChannelsGrid channels={channels} />
    </div>
  );
}

export default OmnichannelPage;