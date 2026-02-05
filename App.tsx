
import React, { useState, useEffect } from 'react';
import { NavTab } from './types';
import { useAuth } from './src/contexts/AuthContext';
import { communityService } from './src/services/community';
import Discovery from './pages/Discovery';
import Shelf from './pages/Shelf';
import Station from './pages/Station';
import Community, { PostItem } from './pages/Community';
import BookPassport from './pages/BookPassport';
import Notifications, { NotificationItem } from './pages/Notifications';
import Auth from './pages/Auth';

const App: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.Discovery);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (user) {
      const fetchPosts = async () => {
        try {
          const data = await communityService.getPosts();
          if (data && data.length > 0) setPosts(data);
        } catch (e) {
          console.error("Failed to load posts", e);
        }
      };
      fetchPosts();
    }
  }, [user]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'handover',
      title: '新的书籍接力',
      content: '小李发起了《非暴力沟通》的传阅，你是下一站接待人，请及时确认。',
      time: '10分钟前',
      unread: true,
      avatar: 'https://picsum.photos/seed/u1/100/100'
    },
    {
      id: '2',
      type: 'interaction',
      title: '获得点赞',
      content: '王经理点赞了你在《原子习惯》中留下的感悟寄语。',
      time: '2小时前',
      unread: true,
      avatar: 'https://picsum.photos/seed/u2/100/100'
    }
  ]);

  // 全局动态数据
  const [posts, setPosts] = useState<PostItem[]>([
    {
      id: 'post-1',
      userName: '王经理',
      targetUser: '小李',
      avatar1: 'https://picsum.photos/seed/u11/100/100',
      avatar2: 'https://picsum.photos/seed/u21/100/100',
      time: '2小时前',
      location: '深圳总部',
      bookTitle: '非暴力沟通',
      content: '读书笔记：这是一本改变了我沟通方式的书，期待它在技术部开启一段奇妙的旅程。希望你能从中受益...',
      likes: 128,
      comments: 24,
      image1: 'https://picsum.photos/seed/feed_a1/400/400',
      image2: 'https://picsum.photos/seed/feed_b1/400/400',
      tag: '跨部门交流'
    },
    {
      id: 'post-2',
      userName: 'Alex Chen',
      targetUser: '全体书友',
      avatar1: 'https://picsum.photos/seed/me/100/100',
      avatar2: 'https://picsum.photos/seed/globe/100/100',
      time: '5小时前',
      location: '1F 咖啡驿站',
      bookTitle: '原子习惯',
      content: '每天进步1%，一年后你将进步37倍。这本书不仅教你方法，更重塑你的思维。',
      likes: 56,
      comments: 8,
      image1: 'https://picsum.photos/seed/feed_a2/400/400',
      image2: 'https://picsum.photos/seed/feed_b2/400/400',
      tag: '深度阅读'
    },
    {
      id: 'post-3',
      userName: 'Sarah Jenkins',
      targetUser: '产品团队',
      avatar1: 'https://picsum.photos/seed/avatar1/100/100',
      avatar2: 'https://picsum.photos/seed/avatar2/100/100',
      time: '昨天',
      location: '3F 休闲区',
      bookTitle: '创新自信力',
      content: '作为领导者，如何激发团队的创造力？书中给出了非常实操的建议。',
      likes: 92,
      comments: 15,
      image1: 'https://picsum.photos/seed/feed_a3/400/400',
      image2: 'https://picsum.photos/seed/feed_b3/400/400',
      tag: '领导力'
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addNotification = (notif: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      time: '刚刚',
      unread: true,
    };
    setNotifications(prev => [newNotif, ...prev]);
    showToast(notif.title);
  };

  const addPost = (newPost: Omit<PostItem, 'id' | 'time' | 'likes' | 'comments'>) => {
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
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const handleNotificationOpen = () => setShowNotifications(true);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span></div>;
  }

  if (!user) {
    return <Auth onLogin={() => {}} />;
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
            onLogout={signOut}
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
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === item.id ? 'text-primary' : 'text-text-muted'
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
