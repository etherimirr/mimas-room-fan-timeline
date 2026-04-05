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
        <p className="hint">正在校准你的时间线…</p>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="room-stage">
        <div className="room-scene">
          <div className="scene-poster" />
          <div className="scene-vase" />
          <div className="scene-cactus" />
        </div>

        <div className="monitor-shell">
          <div className="monitor-bezel">
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
                  <span className="browser-chip active">mina_room</span>
                </div>

                <section className="hero">
                  <span className="eyebrow">Welcome to Mina&apos;s Room</span>
                  <div className="marquee">
                    welcome to my personal homepage... thank you for visiting again...
                  </div>
                  <div className="hero-poster">
                    <div className="hero-poster-portrait">
                      <Image
                        src="/images/mima-idol.webp"
                        alt="Mina idol era portrait"
                        fill
                        sizes="(max-width: 900px) 100vw, 180px"
                        className="hero-poster-image"
                      />
                    </div>
                    <div className="hero-poster-copy">
                      <div className="poster-welcome">Welcome to</div>
                      <h1>未菜の部屋</h1>
                      <p>mina&apos;s tiny room on the web</p>
                    </div>
                  </div>
                  <p>
                    这里原本只是一个很普通的偶像主页。会有近况、短日记、拍摄记录，
                    还有一些只想写给一直回来看的人的小句子。但如果你停留得够久，
                    或者回来得够频繁，页面会慢慢开始记住你。
                  </p>
                  <div className="hero-stamps">
                    <span>fan diary</span>
                    <span>daily memo</span>
                    <span>since 1998</span>
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
                        placeholder="给自己起一个粉丝名字"
                      />
                      <textarea
                        rows={4}
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="给她留一句话。系统会记住这次互动。"
                      />
                      <div className="button-row">
                        <button className="button primary" onClick={handleCommentSubmit}>
                          留言并触发事件
                        </button>
                        <button className="button secondary" onClick={handleNameSave}>
                          保存称呼
                        </button>
                        <button className="button secondary" onClick={handleLoopAdvance}>
                          进入下一周目
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

          <div className="monitor-bottom">
            <div className="speaker speaker-left" />
            <div className="monitor-logo" />
            <div className="speaker speaker-right" />
          </div>
          <div className="monitor-stand" />
        </div>
      </section>
    </main>
  );
}
