"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import DiaryView from "@/components/DiaryView";
import DiaryDetail from "@/components/DiaryDetail";
import StatusPanel from "@/components/StatusPanel";
import { getDefaultSelectedEntryId } from "@/lib/content";
import {
  applyEventEffects,
  getUnlockedEntries,
  getVisibleEventLogs,
  markEntryAsRead
} from "@/lib/engine";
import { createUserState, loadUserState, saveUserState } from "@/state/userStore";

export default function HomeClient({
  initialEntries,
  initialEvents,
  initialServerNow
}) {
  const [user, setUser] = useState(null);
  const [serverNow, setServerNow] = useState(initialServerNow);
  const [comment, setComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState(null);

  useEffect(() => {
    const existing = loadUserState();
    const nextUser = existing ?? createUserState(initialServerNow);
    const viewedUser = applyEventEffects(nextUser, "page_view", initialEvents, initialServerNow);
    saveUserState(viewedUser);
    setUser(viewedUser);
    setDisplayName(viewedUser.display_name ?? "");
  }, [initialEvents, initialServerNow]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/time", { cache: "no-store" });
        const payload = await response.json();
        setServerNow(payload.now);
      } catch {
        setServerNow(new Date().toISOString());
      }
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const unlockedEntries = useMemo(() => {
    if (!user) {
      return [];
    }

    return getUnlockedEntries(initialEntries, user, serverNow);
  }, [initialEntries, serverNow, user]);

  const eventLogs = useMemo(() => {
    if (!user) {
      return [];
    }

    return getVisibleEventLogs(user.event_log ?? []);
  }, [user]);

  const selectedEntry = useMemo(() => {
    if (!unlockedEntries.length) {
      return null;
    }

    return (
      unlockedEntries.find((entry) => entry.id === selectedEntryId) ??
      unlockedEntries[0]
    );
  }, [selectedEntryId, unlockedEntries]);

  useEffect(() => {
    const nextSelectedEntryId = getDefaultSelectedEntryId(unlockedEntries, selectedEntryId);
    if (nextSelectedEntryId !== selectedEntryId) {
      setSelectedEntryId(nextSelectedEntryId);
    }
  }, [selectedEntryId, unlockedEntries]);

  function updateUser(nextUser) {
    saveUserState(nextUser);
    setUser(nextUser);
  }

  function handleOpenEntry(entryId) {
    if (!user) {
      return;
    }

    setSelectedEntryId(entryId);
    updateUser(markEntryAsRead(user, entryId));
  }

  function handleCommentSubmit() {
    if (!user || !comment.trim()) {
      return;
    }

    const withName = {
      ...user,
      display_name: displayName.trim() || user.display_name
    };
    const commentedUser = applyEventEffects(
      withName,
      "comment_submitted",
      initialEvents,
      serverNow,
      { comment: comment.trim() }
    );
    updateUser(commentedUser);
    setComment("");
  }

  function handleNameSave() {
    if (!user) {
      return;
    }

    updateUser({
      ...user,
      display_name: displayName.trim() || user.display_name
    });
  }

  function handleLoopAdvance() {
    if (!user) {
      return;
    }

    const advanced = applyEventEffects(user, "manual_loop_advance", initialEvents, serverNow);
    updateUser(advanced);
  }

  if (!user) {
    return (
      <main className="shell shell-loading">
        <p className="hint">正在打开未麻的主页…</p>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="room-stage">
        <div className="monitor-shell">
          <div className="monitor-screen">
            <div className="desktop-window desktop-window-back">
              <div className="desktop-titlebar">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="desktop-window desktop-window-main">
              <div className="desktop-titlebar">
                <span />
                <span />
                <span />
              </div>
              <div className="browser-strip">
                <span className="browser-chip">home</span>
                <span className="browser-chip">diary</span>
                <span className="browser-chip">memo</span>
                <span className="browser-chip active">mima_room</span>
              </div>

              <section className="hero">
                <span className="eyebrow">Welcome to Mima&apos;s Room</span>
                <div className="marquee">
                  welcome to my personal homepage... thank you for visiting again...
                </div>
                <div className="hero-poster">
                  <div className="hero-poster-portrait">
                    <Image
                      src="/images/mima-idol.webp"
                      alt="Mima idol era portrait"
                      fill
                      sizes="(max-width: 900px) 100vw, 180px"
                      className="hero-poster-image"
                    />
                  </div>
                  <div className="hero-poster-copy">
                    <div className="poster-welcome">Welcome to</div>
                    <h1>未麻の部屋</h1>
                    <p>mima&apos;s personal homepage</p>
                  </div>
                </div>
                <p>
                  大家好喔！这里是未麻的个人网站，会分享我的日记，日常演出和生活！
                  请多多来支持我哦。
                </p>
                <div className="hero-stamps">
                  <span>diary</span>
                  <span>live report</span>
                  <span>mima&apos;s room</span>
                </div>
              </section>

              <section className="dashboard">
                <aside className="panel pad utility-panel">
                  <StatusPanel user={user} serverNow={serverNow} eventLogs={eventLogs} />
                  <div className="composer">
                    <input
                      className="name-input"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="留下你的名字"
                    />
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="给未麻留一句话吧"
                    />
                    <div className="button-row">
                      <button className="button primary" onClick={handleCommentSubmit}>
                        送出留言
                      </button>
                      <button className="button secondary" onClick={handleNameSave}>
                        保存名字
                      </button>
                      <button className="button secondary" onClick={handleLoopAdvance}>
                        打开隐藏页
                      </button>
                    </div>
                  </div>
                </aside>

                <section className="storyboard">
                  <DiaryView
                    entries={unlockedEntries}
                    user={user}
                    selectedEntryId={selectedEntry?.id ?? null}
                    onOpenEntry={handleOpenEntry}
                  />
                  <DiaryDetail entry={selectedEntry} user={user} />
                </section>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
