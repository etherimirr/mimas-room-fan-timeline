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
  const [mainWindowVisible, setMainWindowVisible] = useState(true);
  const [mainWindowMinimized, setMainWindowMinimized] = useState(false);
  const [mainWindowExpanded, setMainWindowExpanded] = useState(false);
  const [desktopWindow, setDesktopWindow] = useState(null);

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

  function handleCloseMainWindow() {
    setMainWindowVisible(false);
    setMainWindowMinimized(false);
  }

  function handleMinimizeMainWindow() {
    setMainWindowMinimized(true);
    setMainWindowVisible(false);
  }

  function handleToggleExpandMainWindow() {
    setMainWindowExpanded((current) => !current);
  }

  function handleRestoreMainWindow() {
    setMainWindowVisible(true);
    setMainWindowMinimized(false);
    setDesktopWindow(null);
  }

  function handleOpenDesktopWindow(type) {
    setDesktopWindow(type);
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
                <button aria-label="close background window" className="window-dot muted" type="button" />
                <button aria-label="minimize background window" className="window-dot muted" type="button" />
                <button aria-label="zoom background window" className="window-dot muted" type="button" />
              </div>
            </div>

            <div className="desktop-surface">
              {mainWindowVisible ? (
                <div
                  className={`desktop-window desktop-window-main${
                    mainWindowExpanded ? " expanded" : ""
                  }`}
                >
                  <div className="desktop-titlebar interactive">
                    <button
                      aria-label="close window"
                      className="window-dot close"
                      onClick={handleCloseMainWindow}
                      type="button"
                    />
                    <button
                      aria-label="minimize window"
                      className="window-dot minimize"
                      onClick={handleMinimizeMainWindow}
                      type="button"
                    />
                    <button
                      aria-label="zoom window"
                      className="window-dot zoom"
                      onClick={handleToggleExpandMainWindow}
                      type="button"
                    />
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
              ) : null}

              <div className="desktop-icons">
                {!mainWindowVisible ? (
                  <button className="desktop-icon" onClick={handleRestoreMainWindow} type="button">
                    <span className="desktop-file html" />
                    <span>未麻の部屋.html</span>
                  </button>
                ) : null}
                <button
                  className="desktop-icon"
                  onClick={() => handleOpenDesktopWindow("photos")}
                  type="button"
                >
                  <span className="desktop-folder" />
                  <span>未麻的照片</span>
                </button>
                <button
                  className="desktop-icon"
                  onClick={() => handleOpenDesktopWindow("schedule")}
                  type="button"
                >
                  <span className="desktop-folder schedule" />
                  <span>未麻的行程</span>
                </button>
                <button
                  className="desktop-icon desktop-icon-trash"
                  onClick={() => handleOpenDesktopWindow("trash")}
                  type="button"
                >
                  <span className="desktop-trash" />
                  <span>回收站</span>
                </button>
                {mainWindowMinimized ? (
                  <button className="desktop-icon" onClick={handleRestoreMainWindow} type="button">
                    <span className="desktop-folder room" />
                    <span>未麻的部屋</span>
                  </button>
                ) : null}
              </div>

              {desktopWindow ? (
                <div className={`desktop-window desktop-window-file ${desktopWindow}`}>
                  <div className="desktop-titlebar interactive">
                    <button
                      aria-label="close file window"
                      className="window-dot close"
                      onClick={() => setDesktopWindow(null)}
                      type="button"
                    />
                    <button
                      aria-label="minimize file window"
                      className="window-dot minimize"
                      onClick={() => setDesktopWindow(null)}
                      type="button"
                    />
                    <button
                      aria-label="restore main room"
                      className="window-dot zoom"
                      onClick={handleRestoreMainWindow}
                      type="button"
                    />
                  </div>
                  <div className="file-window-body">
                    {desktopWindow === "photos" ? (
                      <>
                        <h3>未麻的照片</h3>
                        <div className="file-photo-grid">
                          <div className="file-photo-card">
                            <Image
                              src="/images/mima-idol.webp"
                              alt="Mima photo"
                              width={220}
                              height={150}
                              className="file-photo-image"
                            />
                            <span>CHAM 演出后台</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {desktopWindow === "schedule" ? (
                          <>
                            <h3>未麻的行程</h3>
                            <ul className="schedule-list">
                              <li>4/5 14:00 杂志拍摄</li>
                              <li>4/6 18:30 电台录音</li>
                              <li>4/8 17:00 CHAM 现场活动</li>
                            </ul>
                          </>
                        ) : (
                          <>
                            <h3>回收站</h3>
                            <ul className="trash-list">
                              <li>old_index.html</li>
                              <li>memo_draft.txt</li>
                              <li>guestbook_copy.log</li>
                            </ul>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
