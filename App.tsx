
import React, { useState, useEffect } from 'react';
import { NavTab } from './types';
import Discovery from './pages/Discovery';
import Shelf from './pages/Shelf';
import Station from './pages/Station';
import Community, { PostItem } from './pages/Community';
import BookPassport from './pages/BookPassport';
import Notifications, { NotificationItem } from './pages/Notifications';
import Auth from './pages/Auth';
import { communityService } from './services/communityService';
import { userService } from './services/userService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.Discovery);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  // 全局动态数据
  const [posts, setPosts] = useState<PostItem[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      const loadData = async () => {
        try {
          // In a real app, we would get the current user ID dynamically
          const currentUserId = 'user-id-placeholder';
          const [fetchedPosts, fetchedNotifs] = await Promise.all([
            communityService.fetchPosts(),
            userService.getNotifications(currentUserId)
          ]);

          // Data transformation might be needed here to match Frontend types exactly 
          // if the DB schema differs slightly (e.g. snake_case vs camelCase)
          // For now assuming the service returns compatible structures or we map them.
          // This is a simplified integration.
          if (fetchedPosts) setPosts(fetchedPosts as any); // Casting for initial integration
          if (fetchedNotifs) setNotifications(fetchedNotifs as any);

        } catch (error) {
          console.error('Failed to load data', error);
          showToast('加载数据失败', 'info');
        }
      };
      loadData();
    }
  }, [isLoggedIn]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addNotification = (notif: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => {
    // Optimistic update, ignoring backend for this demo action
    const newNotif: NotificationItem = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      time: '刚刚',
      unread: true,
    };
    setNotifications(prev => [newNotif, ...prev]);
    showToast(notif.title);
  };

  const addPost = async (newPost: Omit<PostItem, 'id' | 'time' | 'likes' | 'comments'>) => {
    try {
      // optimistically update UI
      const post: PostItem = {
        ...newPost,
        id: `post-${Date.now()}`,
        time: '刚刚',
        likes: 0,
        comments: 0
      };
      setPosts([post, ...posts]);
      showToast('发布动态成功！');
      setActiveTab(NavTab.Community);

      // Call backend
      await communityService.createPost(newPost, 'current-user-id');
    } catch (e) {
      console.error(e);
      showToast('发布同步失败', 'info');
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const handleNotificationOpen = () => setShowNotifications(true);

  if (!isLoggedIn) {
    return <Auth onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    if (showNotifications) {
      return (
        <Notifications
          onBack={() => setShowNotifications(false)}
          notifications={notifications}
          markRead={markRead}
          markAllRead={markAllRead}
        />
      );
    }

    if (selectedBookId) {
      return (
        <BookPassport
          bookId={selectedBookId}
          onBack={() => setSelectedBookId(null)}
          onShare={addPost}
        />
      );
    }

    switch (activeTab) {
      case NavTab.Discovery:
        return (
          <Discovery
            onBookClick={setSelectedBookId}
            onNotificationClick={handleNotificationOpen}
            hasUnread={unreadCount > 0}
          />
        );
      case NavTab.Shelf:
        return <Shelf onBookClick={setSelectedBookId} />;
      case NavTab.Station:
        return (
          <Station
            onBookClick={setSelectedBookId}
            onNotificationClick={handleNotificationOpen}
            hasUnread={unreadCount > 0}
            addNotification={addNotification}
            onShare={addPost}
            onLogout={() => setIsLoggedIn(false)}
          />
        );
      case NavTab.Community:
        return (
          <Community
            posts={posts}
            onNotificationClick={handleNotificationOpen}
            hasUnread={unreadCount > 0}
          />
        );
      default:
        return (
          <Discovery
            onBookClick={setSelectedBookId}
            onNotificationClick={handleNotificationOpen}
            hasUnread={unreadCount > 0}
          />
        );
    }
  };

  const navItems = [
    { id: NavTab.Discovery, label: '发现', icon: 'explore' },
    { id: NavTab.Shelf, label: '书架', icon: 'auto_stories' },
    { id: NavTab.Station, label: '驿站', icon: 'location_on' },
    { id: NavTab.Community, label: '书友圈', icon: 'forum' },
  ];

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-background flex flex-col relative shadow-xl font-sans overflow-x-hidden">
      {/* Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {renderContent()}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-bounce-in">
          <div className="bg-white/95 backdrop-blur-md border border-primary/20 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary fill-icon">notifications_active</span>
            <p className="text-sm font-bold text-text">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {!selectedBookId && !showNotifications && (
        <nav className="fixed bottom-0 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 flex justify-around py-3 px-6 z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-primary' : 'text-text-muted'
                }`}
            >
              <span className={`material-symbols-outlined ${activeTab === item.id ? 'fill-icon' : ''} relative`}>
                {item.icon}
                {(item.id === NavTab.Station || item.id === NavTab.Community) && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </span>
              <span className={`text-[10px] font-bold ${activeTab === item.id ? '' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      )}

      <style>{`
        .animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        @keyframes bounceIn {
          from { transform: translate(-50%, -50px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
