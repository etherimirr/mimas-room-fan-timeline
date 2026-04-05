"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import DiaryView from "@/components/DiaryView";
import DiaryDetail from "@/components/DiaryDetail";
import StatusPanel from "@/components/StatusPanel";
import { getDefaultSelectedEntryId } from "@/lib/content";
import { isNightTime } from "@/lib/time";
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
  const [activeTab, setActiveTab] = useState("home");
  const [mainWindowVisible, setMainWindowVisible] = useState(true);
  const [mainWindowMinimized, setMainWindowMinimized] = useState(false);
  const [mainWindowExpanded, setMainWindowExpanded] = useState(false);
  const [mainWindowPosition, setMainWindowPosition] = useState({ x: 0, y: 52 });
  const [desktopWindow, setDesktopWindow] = useState(null);
  const [guestbookDraft, setGuestbookDraft] = useState("");
  const [guestbookMessages, setGuestbookMessages] = useState([
    {
      id: "mima-1",
      author: "未麻",
      body: "谢谢你来看我的主页，如果方便的话，也给我留一句话吧。",
      side: "mima"
    },
    {
      id: "fan-1",
      author: "粉丝",
      body: "今天的演出很棒，我会继续支持你的！",
      side: "fan"
    }
  ]);
  const desktopSurfaceRef = useRef(null);
  const mainWindowRef = useRef(null);
  const dragStateRef = useRef(null);

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

  const featuredEntry = useMemo(
    () => unlockedEntries.find((entry) => entry.type === "notice") ?? null,
    [unlockedEntries]
  );

  const diaryEntries = useMemo(
    () => unlockedEntries.filter((entry) => entry.type !== "notice"),
    [unlockedEntries]
  );

  const selectableEntries = useMemo(
    () => (featuredEntry ? [featuredEntry, ...diaryEntries] : diaryEntries),
    [diaryEntries, featuredEntry]
  );

  const eventLogs = useMemo(() => {
    if (!user) {
      return [];
    }

    return getVisibleEventLogs(user.event_log ?? []);
  }, [user]);

  const isNightVisit = useMemo(() => isNightTime(serverNow), [serverNow]);

  const selectedEntry = useMemo(() => {
    if (!selectableEntries.length) {
      return null;
    }

    return (
      selectableEntries.find((entry) => entry.id === selectedEntryId) ??
      selectableEntries[0]
    );
  }, [selectableEntries, selectedEntryId]);

  useEffect(() => {
    const nextSelectedEntryId = getDefaultSelectedEntryId(selectableEntries, selectedEntryId);
    if (nextSelectedEntryId !== selectedEntryId) {
      setSelectedEntryId(nextSelectedEntryId);
    }
  }, [selectableEntries, selectedEntryId]);

  useEffect(() => {
    if (!mainWindowVisible || mainWindowExpanded) {
      return;
    }

    centerMainWindow();
  }, [mainWindowExpanded, mainWindowVisible]);

  useEffect(() => {
    function handlePointerMove(event) {
      const dragState = dragStateRef.current;
      if (!dragState || !desktopSurfaceRef.current || !mainWindowRef.current) {
        return;
      }

      const surfaceRect = desktopSurfaceRef.current.getBoundingClientRect();
      const windowRect = mainWindowRef.current.getBoundingClientRect();
      const nextX = event.clientX - surfaceRect.left - dragState.offsetX;
      const nextY = event.clientY - surfaceRect.top - dragState.offsetY;
      setMainWindowPosition(
        clampWindowPosition(nextX, nextY, surfaceRect.width, surfaceRect.height, windowRect.width, windowRect.height)
      );
    }

    function handlePointerUp() {
      dragStateRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  function updateUser(nextUser) {
    saveUserState(nextUser);
    setUser(nextUser);
  }

  function handleOpenEntry(entryId) {
    if (!user) {
      return;
    }

    setSelectedEntryId(entryId);
    const targetEntry = selectableEntries.find((entry) => entry.id === entryId);
    if (targetEntry?.type === "notice") {
      setActiveTab("live");
    } else {
      setActiveTab("diary");
    }
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

  function handleBrowserTabChange(nextTab) {
    setActiveTab(nextTab);
  }

  function handleMainWindowDragStart(event) {
    if (mainWindowExpanded || event.target.closest("button") || !mainWindowRef.current) {
      return;
    }

    const rect = mainWindowRef.current.getBoundingClientRect();
    dragStateRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
  }

  function centerMainWindow() {
    if (!desktopSurfaceRef.current || !mainWindowRef.current) {
      return;
    }

    const surfaceRect = desktopSurfaceRef.current.getBoundingClientRect();
    const windowRect = mainWindowRef.current.getBoundingClientRect();
    const centeredX = Math.max((surfaceRect.width - windowRect.width) / 2, 12);
    setMainWindowPosition({
      x: centeredX,
      y: 52
    });
  }

  function handleOpenDesktopWindow(type) {
    setDesktopWindow(type);
  }

  function handleGuestbookSubmit() {
    const message = guestbookDraft.trim();
    if (!message) {
      return;
    }

    const fanName = displayName.trim() || "粉丝";
    setGuestbookMessages((current) => [
      ...current,
      {
        id: `fan-${Date.now()}`,
        author: fanName,
        body: message,
        side: "fan"
      },
      {
        id: `mima-${Date.now() + 1}`,
        author: "未麻",
        body: "我看到你的留言了，谢谢你一直来看我。下次也要再来喔。",
        side: "mima"
      }
    ]);
    setGuestbookDraft("");
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
          <div className={`monitor-screen${isNightVisit ? " night-mode" : ""}`}>
            <div className="desktop-surface" ref={desktopSurfaceRef}>
              {mainWindowVisible ? (
                <div
                  ref={mainWindowRef}
                  className={`desktop-window desktop-window-main${
                    mainWindowExpanded ? " expanded" : ""
                  }${isNightVisit ? " night-mode" : ""}`}
                  style={
                    mainWindowExpanded
                      ? { top: 12, left: 12 }
                      : { top: mainWindowPosition.y, left: mainWindowPosition.x }
                  }
                >
                  <div
                    className={`desktop-titlebar interactive${mainWindowExpanded ? "" : " draggable"}`}
                    onPointerDown={handleMainWindowDragStart}
                  >
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
                    {[
                      { id: "home", label: "home" },
                      { id: "diary", label: "diary" },
                      { id: "gallery", label: "gallery" },
                      { id: "live", label: "live" },
                      { id: "contact", label: "contact" }
                    ].map((tab) => (
                      <button
                        className={`browser-chip${activeTab === tab.id ? " active" : ""}`}
                        key={tab.id}
                        onClick={() => handleBrowserTabChange(tab.id)}
                        type="button"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "home" ? (
                    <>
                      <section className={`hero${isNightVisit ? " night-mode" : ""}`}>
                        <span className="eyebrow">Welcome to Mima&apos;s Room</span>
                        <div className={`marquee${isNightVisit ? " night-marquee" : ""}`}>
                          {isNightVisit
                            ? "the room is quieter at night... thank you for staying a little longer..."
                            : "welcome to my personal homepage... thank you for visiting again..."}
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
                            <div className="poster-kicker">欢迎来到</div>
                            <div className={`poster-welcome${isNightVisit ? " melt-text" : ""}`}>Welcome to</div>
                            <h1>未麻の部屋</h1>
                            <p>mima&apos;s personal homepage</p>
                          </div>
                        </div>
                        <p>
                          {isNightVisit
                            ? "这么晚还来看我吗？这里晚上会安静一点，也会把白天没说完的小事慢慢放出来。"
                            : "大家好喔！这里是未麻的个人网站，会分享我的日记，日常演出和生活！请多多来支持我哦。"}
                        </p>
                        {isNightVisit ? (
                          <p className="night-whisper float-text">
                            现在这个时间，页面像是只剩下你和我在看着它。
                          </p>
                        ) : null}
                        <div className="hero-stamps">
                          <button
                            className="hero-tab-button"
                            onClick={() => handleOpenDesktopWindow("profile")}
                            type="button"
                          >
                            生平介绍
                          </button>
                          <button
                            className="hero-tab-button"
                            onClick={() => handleOpenDesktopWindow("secret")}
                            type="button"
                          >
                            独家揭秘
                          </button>
                          <button
                            className="hero-tab-button"
                            onClick={() => handleOpenDesktopWindow("reports")}
                            type="button"
                          >
                            报道
                          </button>
                          <button
                            className="hero-tab-button"
                            onClick={() => handleOpenDesktopWindow("contact")}
                            type="button"
                          >
                            contact
                          </button>
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
                          <div className="links-panel">
                            <span className="links-title">favorite links</span>
                            <button
                              className="favorite-link"
                              onClick={() => handleOpenDesktopWindow("cham")}
                              type="button"
                            >
                              CHAM official
                            </button>
                            <button
                              className="favorite-link"
                              onClick={() => handleOpenDesktopWindow("fanclub")}
                              type="button"
                            >
                              fan club
                            </button>
                            <button
                              className="favorite-link"
                              onClick={() => handleOpenDesktopWindow("station")}
                              type="button"
                            >
                              tv station
                            </button>
                            <button
                              className="favorite-link"
                              onClick={() => handleOpenDesktopWindow("bookmarks")}
                              type="button"
                            >
                              favorite links
                            </button>
                          </div>
                        </aside>

                        <section className="storyboard">
                          <DiaryView
                            featuredEntry={featuredEntry}
                            entries={diaryEntries}
                            user={user}
                            selectedEntryId={selectedEntry?.id ?? null}
                            onOpenEntry={handleOpenEntry}
                          />
                          <DiaryDetail entry={selectedEntry} user={user} />
                        </section>
                      </section>
                    </>
                  ) : null}

                  {activeTab === "diary" ? (
                    <section className="dashboard dashboard-single">
                      <section className="storyboard storyboard-wide">
                        <DiaryView
                          featuredEntry={null}
                          entries={diaryEntries}
                          user={user}
                          selectedEntryId={selectedEntry?.id ?? null}
                          onOpenEntry={handleOpenEntry}
                        />
                        <DiaryDetail entry={selectedEntry} user={user} />
                      </section>
                    </section>
                  ) : null}

                  {activeTab === "live" ? (
                    <section className="dashboard dashboard-single">
                      <section className={`panel pad live-panel${isNightVisit ? " night-mode" : ""}`}>
                        <div className="detail-kicker">live schedule</div>
                        <h2>{featuredEntry?.title ?? "下一次演出预告"}</h2>
                        <div className="live-panel-grid">
                          <div className="live-poster">
                            <Image
                              src={featuredEntry?.thumbnail ?? "/images/mima-idol.webp"}
                              alt={featuredEntry?.thumbnailAlt ?? "Mima live notice"}
                              fill
                              sizes="(max-width: 900px) 100vw, 320px"
                              className="file-photo-image"
                            />
                          </div>
                          <div className="live-copy">
                            <p>{featuredEntry?.content ?? "下周会有新的公开活动。"}</p>
                            <div className="contact-sheet">
                              <div className="contact-card">
                                <strong>活动时间</strong>
                                <span>下周六 15:00</span>
                              </div>
                              <div className="contact-card">
                                <strong>活动地点</strong>
                                <span>涩谷户外舞台 / CHAM 特别公开活动</span>
                              </div>
                              <div className="contact-card">
                                <strong>小提示</strong>
                                <span>如果来得早一点，也许能在开场前看见未麻彩排。</span>
                              </div>
                            </div>
                            <div className="live-video-shell">
                              <div className="live-video-header">
                                <span>video player</span>
                                <span>stand by</span>
                              </div>
                              <div className="live-video-frame">
                                <div className={`live-video-screen${isNightVisit ? " night-player" : ""}`}>
                                  <span className={isNightVisit ? "melt-text" : ""}>
                                    {isNightVisit ? "现在没有影片播放" : "暂无影片播放"}
                                  </span>
                                  <small>
                                    {isNightVisit
                                      ? "夜里打开时，播放器会比白天更安静一点。后续剧情触发时，这里会出现演出录像或异常影像。"
                                      : "后续剧情触发时，这里会出现演出录像或异常影像。"}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    </section>
                  ) : null}

                  {activeTab === "gallery" ? (
                    <section className="dashboard dashboard-single">
                      <section className="panel pad gallery-panel">
                        <div className="detail-kicker">photo gallery</div>
                        <h2>未麻的图集</h2>
                        <div className="gallery-grid">
                          {[1, 2, 3].map((item) => (
                            <figure className="gallery-card" key={item}>
                              <div className="gallery-image-wrap">
                                <Image
                                  src="/images/mima-idol.webp"
                                  alt={`Mima gallery image ${item}`}
                                  fill
                                  sizes="(max-width: 900px) 100vw, 260px"
                                  className="gallery-image"
                                />
                              </div>
                              <figcaption>
                                {item === 1
                                  ? "舞台灯光还没有全亮的时候"
                                  : item === 2
                                    ? "CHAM 活动结束后的合影"
                                    : "拍摄日留在后台的小照片"}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      </section>
                    </section>
                  ) : null}

                  {activeTab === "contact" ? (
                    <section className="dashboard dashboard-single">
                      <section className="panel pad contact-panel-page">
                        <div className="detail-kicker">contact</div>
                        <h2>如何联系未麻</h2>
                        <div className="contact-sheet">
                          <div className="contact-card">
                            <strong>工作室地址</strong>
                            <span>东京涩谷区神南 2-14-7 CHAM 事务联络室</span>
                          </div>
                          <div className="contact-card">
                            <strong>联系邮箱</strong>
                            <span>mima-room@cham-office.jp</span>
                          </div>
                          <div className="contact-card">
                            <strong>合作方式</strong>
                            <span>杂志拍摄、广播节目、活动出演、品牌联动来信请注明时间与企划概要。</span>
                          </div>
                          <div className="contact-card">
                            <strong>来信说明</strong>
                            <span>粉丝来信与工作联系会分开整理，回复可能会慢一点，请温柔一点等我。</span>
                          </div>
                        </div>
                      </section>
                    </section>
                  ) : null}
                </div>
              ) : null}

              <div className="desktop-icons">
                <button className="desktop-icon" onClick={handleRestoreMainWindow} type="button">
                  <span className="desktop-file html" />
                  <span>未麻の部屋.html</span>
                </button>
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
                  className="desktop-icon"
                  onClick={() => handleOpenDesktopWindow("guestbook")}
                  type="button"
                >
                  <span className="desktop-folder guestbook" />
                  <span>留言箱</span>
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
                        ) : desktopWindow === "guestbook" ? (
                          <>
                            <h3>留言箱</h3>
                            <div className="guestbook-thread">
                              {guestbookMessages.map((message) => (
                                <div
                                  className={`guestbook-bubble ${message.side}`}
                                  key={message.id}
                                >
                                  <strong>{message.author}</strong>
                                  <span>{message.body}</span>
                                </div>
                              ))}
                            </div>
                            <div className="guestbook-compose">
                              <textarea
                                rows={3}
                                value={guestbookDraft}
                                onChange={(event) => setGuestbookDraft(event.target.value)}
                                placeholder="给未麻写封短短的留言吧"
                              />
                              <button className="button primary" onClick={handleGuestbookSubmit}>
                                送出邮件
                              </button>
                            </div>
                          </>
                        ) : desktopWindow === "contact" ? (
                          <>
                            <h3>如何联系</h3>
                            <div className="contact-sheet">
                              <div className="contact-card">
                                <strong>工作室地址</strong>
                                <span>东京涩谷区神南 2-14-7 CHAM 事务联络室</span>
                              </div>
                              <div className="contact-card">
                                <strong>联系邮箱</strong>
                                <span>mima-room@cham-office.jp</span>
                              </div>
                              <div className="contact-card">
                                <strong>合作方式</strong>
                                <span>杂志拍摄、广播节目、活动出演、品牌联动来信请注明时间与企划概要。</span>
                              </div>
                              <div className="contact-card">
                                <strong>来信说明</strong>
                                <span>粉丝来信与工作联系会分开整理，回复可能会慢一点，请温柔一点等我。</span>
                              </div>
                            </div>
                          </>
                        ) : desktopWindow === "profile" ? (
                          <>
                            <h3>未麻的生平介绍</h3>
                            <div className="contact-sheet">
                              <div className="contact-card">
                                <strong>所属组合</strong>
                                <span>CHAM! 偶像组合成员之一，以清新路线和现场亲和力被熟悉。</span>
                              </div>
                              <div className="contact-card">
                                <strong>职业路径</strong>
                                <span>从偶像活动、杂志拍摄，到广播与影视相关工作，逐渐开始扩大自己的舞台。</span>
                              </div>
                              <div className="contact-card">
                                <strong>最近近况</strong>
                                <span>除了练习和演出，也开始尝试更多镜头前的工作，最近常常在摄影棚和录音间来回跑。</span>
                              </div>
                            </div>
                          </>
                        ) : desktopWindow === "secret" ? (
                          <>
                            <h3>未麻的独家揭秘</h3>
                            <div className="guestbook-thread">
                              <div className="guestbook-bubble mima">
                                <strong>今天的小分享</strong>
                                <span>拍摄结束后去便利店买了草莓牛奶，冰柜前站了好久才选好。</span>
                              </div>
                              <div className="guestbook-bubble fan">
                                <strong>后台小事</strong>
                                <span>化妆间的灯有时候太亮了，照镜子会有点不像平时的自己。</span>
                              </div>
                              <div className="guestbook-bubble mima">
                                <strong>只写在这里</strong>
                                <span>有些话不太适合正式采访里说，所以就偷偷放在这个页面里。</span>
                              </div>
                            </div>
                          </>
                        ) : desktopWindow === "reports" ? (
                          <>
                            <h3>最近报道</h3>
                            <div className="contact-sheet">
                              <div className="contact-card">
                                <strong>《偶像月刊》</strong>
                                <span>CHAM! 新舞台服装幕后采访，未麻提到最近最喜欢的排练时刻是开场前的灯光测试。</span>
                              </div>
                              <div className="contact-card">
                                <strong>电台节目摘录</strong>
                                <span>未麻说，最开心的是有人会记得她在某一场活动里说过的小句子。</span>
                              </div>
                              <div className="contact-card">
                                <strong>活动现场报道</strong>
                                <span>涩谷公开活动结束后，现场粉丝停留了很久，直到舞台灯慢慢关掉。</span>
                              </div>
                            </div>
                          </>
                        ) : desktopWindow === "cham" ? (
                          <>
                            <h3>CHAM official</h3>
                            <div className="contact-sheet">
                              <div className="contact-card">
                                <strong>本周公告</strong>
                                <span>CHAM! 下周将参加涩谷户外特别活动，请大家继续支持三人的新舞台。</span>
                              </div>
                              <div className="contact-card">
                                <strong>成员更新</strong>
                                <span>未麻最近在练习之外也开始尝试更多拍摄与广播相关工作。</span>
                              </div>
                            </div>
                          </>
                        ) : desktopWindow === "fanclub" ? (
                          <>
                            <h3>fan club</h3>
                            <div className="contact-sheet">
                              <div className="contact-card">
                                <strong>会员留言</strong>
                                <span>“今天也来看未麻的主页了，晚上打开的时候真的会更安静一点。”</span>
                              </div>
                              <div className="contact-card">
                                <strong>应援信息</strong>
                                <span>下次活动前，大家会准备新的手幅和应援卡片。</span>
                              </div>
                            </div>
                          </>
                        ) : desktopWindow === "station" ? (
                          <>
                            <h3>tv station</h3>
                            <div className="contact-sheet">
                              <div className="contact-card">
                                <strong>节目预告</strong>
                                <span>未麻预计将在本周广播节目中读到部分观众来信，也可能提到新的演出安排。</span>
                              </div>
                              <div className="contact-card">
                                <strong>录影棚消息</strong>
                                <span>节目组说，最近她在镜头前显得比以前更安静，也更让人移不开视线。</span>
                              </div>
                            </div>
                          </>
                        ) : desktopWindow === "bookmarks" ? (
                          <>
                            <h3>favorite links</h3>
                            <ul className="schedule-list">
                              <li>CHAM official</li>
                              <li>fan club board</li>
                              <li>tv station weekly</li>
                              <li>idol magazine archive</li>
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

function clampWindowPosition(x, y, surfaceWidth, surfaceHeight, windowWidth, windowHeight) {
  return {
    x: clamp(x, 12, Math.max(surfaceWidth - windowWidth - 12, 12)),
    y: clamp(y, 12, Math.max(surfaceHeight - windowHeight - 12, 12))
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
