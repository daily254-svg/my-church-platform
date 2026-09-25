import { useState } from "react";
import { clearToken, type AuthedUser } from "../api";
import MembersSection from "../sections/MembersSection";
import MinistriesSection from "../sections/MinistriesSection";
import EventsSection from "../sections/EventsSection";
import SermonsSection from "../sections/SermonsSection";
import AnnouncementsSection from "../sections/AnnouncementsSection";
import GivingSection from "../sections/GivingSection";
import PrayersSection from "../sections/PrayersSection";
import InvitesSection from "../sections/InvitesSection";
import BranchesSection from "../sections/BranchesSection";

interface Props {
  token: string;
  user: AuthedUser;
  onLogout: () => void;
}

const TABS = [
  { key: "members", label: "Members" },
  { key: "ministries", label: "Ministries" },
  { key: "events", label: "Events" },
  { key: "sermons", label: "Sermons" },
  { key: "announcements", label: "Announcements" },
  { key: "giving", label: "Giving" },
  { key: "prayers", label: "Prayers" },
  { key: "invites", label: "Invites" },
  { key: "branches", label: "Branches" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Dashboard({ token, user, onLogout }: Props) {
  const [tab, setTab] = useState<TabKey>("members");

  return (
    <div>
      <div className="topbar">
        <strong>Church Admin</strong>
        <div>
          <span style={{ marginRight: 12, fontSize: 13, color: "#666" }}>
            {user.email} · {user.role}
          </span>
          <button
            className="btn-secondary"
            onClick={() => {
              clearToken();
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="container">
        {tab === "members" && <MembersSection token={token} />}
        {tab === "ministries" && <MinistriesSection token={token} />}
        {tab === "events" && <EventsSection token={token} />}
        {tab === "sermons" && <SermonsSection token={token} />}
        {tab === "announcements" && <AnnouncementsSection token={token} />}
        {tab === "giving" && <GivingSection token={token} />}
        {tab === "prayers" && <PrayersSection token={token} />}
        {tab === "invites" && <InvitesSection token={token} />}
        {tab === "branches" && <BranchesSection token={token} />}
      </div>
    </div>
  );
}
