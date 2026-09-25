import { useEffect, useState } from "react";
import { clearToken, type AuthedUser, type StaffRole } from "../api";
import { ROLE_SCREENS, type TabKey } from "../permissions";
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

const ALL_TABS: { key: TabKey; label: string }[] = [
  { key: "members", label: "Members" },
  { key: "ministries", label: "Ministries" },
  { key: "events", label: "Events" },
  { key: "sermons", label: "Sermons" },
  { key: "announcements", label: "Announcements" },
  { key: "giving", label: "Giving" },
  { key: "prayers", label: "Prayers" },
  { key: "invites", label: "Invites" },
  { key: "branches", label: "Branches" },
];

export default function Dashboard({ token, user, onLogout }: Props) {
  const allowed = ROLE_SCREENS[user.role as StaffRole] ?? [];
  const tabs = ALL_TABS.filter((t) => allowed.includes(t.key));
  const [tab, setTab] = useState<TabKey>(tabs[0]?.key ?? "members");

  // If the role (or its permitted screens) ever changes under us, don't
  // strand the user on a tab they can no longer see.
  useEffect(() => {
    if (!allowed.includes(tab) && tabs[0]) {
      setTab(tabs[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.role]);

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
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="container">
        {tab === "members" && <MembersSection token={token} role={user.role as StaffRole} />}
        {tab === "ministries" && <MinistriesSection token={token} />}
        {tab === "events" && <EventsSection token={token} />}
        {tab === "sermons" && <SermonsSection token={token} />}
        {tab === "announcements" && <AnnouncementsSection token={token} role={user.role as StaffRole} />}
        {tab === "giving" && <GivingSection token={token} />}
        {tab === "prayers" && <PrayersSection token={token} role={user.role as StaffRole} />}
        {tab === "invites" && <InvitesSection token={token} />}
        {tab === "branches" && <BranchesSection token={token} />}
      </div>
    </div>
  );
}
