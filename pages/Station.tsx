
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { authService } from '../src/services/auth';
import { NotificationItem } from './Notifications';
import { PostItem } from './Community';

interface LocalBook {
  id: string;
  title: string;
  author: string;
  nickname: string;
  status: string;
  active: boolean;
  cover: string;
  distance?: string;
  receiver?: string;
}

interface Medal {
  id: string;
  icon: string;
  label: string;
  description: string;
  requirement: string;
  color: string;
  unlocked: boolean;
  unlockDate?: string;
}

const ALL_MEDALS: Medal[] = [
  { id: '1', icon: 'public', label: '知识外交官', description: '跨越 5 个不同部门进行图书传递', requirement: '累计传递书籍给 5 个不同部门的同事', color: 'from-yellow-300 to-orange-500', unlocked: true, unlockDate: '2024.03.12' },
  { id: '2', icon: 'home_work', label: '首席驿站', description: '在同一驿站内成功接待 10 本书籍', requirement: '作为驿站主接待过 10 本不同的书', color: 'from-primary to-emerald-600', unlocked: true, unlockDate: '2024.01.20' },
  { id: '3', icon: 'explore', label: '书籍拓荒者', description: '第一位将新书带入流动系统的用户', requirement: '发起 3 次全新的图书旅行', color: 'from-blue-400 to-indigo-600', unlocked: true, unlockDate: '2023.11.05' },
  { id: '4', icon: 'light_mode', label: '早起鸟', description: '在早上 8 点前完成一次扫码交接', requirement: '在清晨时分完成书籍接力', color: 'from-purple-400 to-pink-500', unlocked: true, unlockDate: '2024.02.15' },
  { id: '5', icon: 'auto_graph', label: '里程碑', description: '单本书籍在你手中产生的里程超过 50km', requirement: '负责的图书旅行里程累计超过 50km', color: 'from-red-400 to-rose-600', unlocked: false },
  { id: '6', icon: 'auto_stories', label: '共读领袖', description: '发起的书籍在书友圈获得超过 100 次点赞', requirement: '动态累计获得 100 个赞', color: 'from-cyan-400 to-blue-500', unlocked: false },
  { id: '7', icon: 'local_cafe', label: '咖啡大使', description: '累计通过书友圈赠送出 10 杯咖啡', requirement: '赠送 10 次虚拟咖啡激励', color: 'from-amber-600 to-amber-800', unlocked: false },
];

interface StationProps {
  onBookClick?: (id: string) => void;
  onNotificationClick?: () => void;
  hasUnread?: boolean;
  addNotification?: (notif: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => void;
  onShare?: (post: Omit<PostItem, 'id' | 'time' | 'likes' | 'comments'>) => void;
  onLogout?: () => void;
}

const Station: React.FC<StationProps> = ({ onBookClick, onNotificationClick, hasUnread, addNotification, onShare, onLogout }) => {
  const { user: authUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'hosting' | 'circulated'>('hosting');
  const [showHandover, setShowHandover] = useState(false);
  const [handoverStep, setHandoverStep] = useState<'form' | 'processing' | 'success'>('form');

  const [showMedalsGallery, setShowMedalsGallery] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMedal, setSelectedMedal] = useState<Medal | null>(null);

  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [sharingBook, setSharingBook] = useState<LocalBook | null>(null);
  const [shareContent, setShareContent] = useState('');

  const [user, setUser] = useState({
    name: '加载中...',
    role: '高级产品经理', // Mock default
    avatar: 'https://picsum.photos/seed/me/200/200',
    level: 1,
    title: '初级书虫',
    bio: '爱书、爱旅行、爱分享。希望每一本书都能找到它的归属。'
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (authUser) {
        // 先尝试从 auth metadata 获取
        const metadata = authUser.user_metadata;
        setUser(prev => ({
          ...prev,
          name: metadata.username || authUser.email?.split('@')[0] || '书友',
          avatar: metadata.avatar_url || prev.avatar
        }));

        // 也可以从 profiles 表获取更详细信息 (role, bio 等)
        const { data: profile } = await authService.getProfile(authUser.id);
        if (profile) {
          setUser(prev => ({
            ...prev,
            name: profile.username || prev.name,
            avatar: profile.avatar_url || prev.avatar,
            role: profile.department || prev.role, // 这里暂用 department 代替 role 展示
            bio: profile.bio || prev.bio
          }));
        }
      }
    };
    loadProfile();
  }, [authUser]);

  const [editFormData, setEditFormData] = useState({ ...user });

  // Update edit form when user data loads
  useEffect(() => {
    setEditFormData({ ...user });
  }, [user]);

  const [settings, setSettings] = useState({
    pushNotifications: true,
    privacyMode: false,
    autoAccept: true,
  });

  const [hostedBooks, setHostedBooks] = useState<LocalBook[]>([
    { id: 'host-1', title: '原子习惯', author: 'James Clear', nickname: '习惯大师', status: '3天前到达', active: true, cover: 'https://picsum.photos/seed/st0/200/300' },
    { id: 'host-2', title: '设计心理学', author: 'Don Norman', nickname: '造物主视角', status: '已停留 1周', active: false, cover: 'https://picsum.photos/seed/st1/200/300' }
  ]);

  const [circulatedBooks, setCirculatedBooks] = useState<LocalBook[]>([
    { id: 'circ-1', title: '午夜图书馆', author: 'Matt Haig', nickname: '回声寻找者', status: '2024.03.15 传出', active: false, cover: 'https://picsum.photos/seed/book1/200/300', distance: '124km', receiver: 'Sarah J.' },
    { id: 'circ-2', title: '沙丘', author: 'Frank Herbert', nickname: '香料之路', status: '2024.02.10 传出', active: false, cover: 'https://picsum.photos/seed/book3/200/300', distance: '850km', receiver: 'David C.' }
  ]);

  const getHostingProgress = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 20 + (hash % 66);
  };

  const filteredHostedBooks = useMemo(() => {
    return hostedBooks.filter(book =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [hostedBooks, searchQuery]);

  const filteredCirculatedBooks = useMemo(() => {
    return circulatedBooks.filter(book =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [circulatedBooks, searchQuery]);

  const [handoverData, setHandoverData] = useState({ note: '', method: 'qrcode' as 'qrcode' | 'station' });

  const handleInitiateHandover = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedBookIndex(index);
    setHandoverStep('form');
    setShowHandover(true);
  };

  const confirmHandoverAction = () => {
    setHandoverStep('processing');
    const book = hostedBooks[selectedBookIndex!];

    setTimeout(() => {
      setHandoverStep('success');
      const newCirculated: LocalBook = {
        ...book,
        active: false,
        status: handoverData.method === 'qrcode' ? '刚刚传出' : '已入库驿站',
        distance: '0.5km',
        receiver: handoverData.method === 'qrcode' ? '待确认' : '智能驿站'
      };
      setCirculatedBooks([newCirculated, ...circulatedBooks]);
      setHostedBooks(hostedBooks.filter((_, i) => i !== selectedBookIndex));

      addNotification?.({
        type: 'handover',
        title: handoverData.method === 'qrcode' ? '交接任务已启动' : '投递任务已准备',
        content: `《${book.title}》的接力任务已就绪，请按指引完成最后一步。`,
      });
    }, 1500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...editFormData });
    setShowEditProfile(false);
    addNotification?.({
      type: 'system',
      title: '资料更新成功',
      content: '你的个人主页已焕然一新！'
    });
  };

  return (
    <div className="animate-fade-in pb-10">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 h-16">
        {!isSearching ? (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-text">settings</span>
              </button>
              <button onClick={() => setIsSearching(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-text">search</span>
              </button>
            </div>
            <h2 className="text-text text-lg font-bold">我的驿站</h2>
            <button onClick={onNotificationClick} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 relative active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-text">notifications</span>
              {hasUnread && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 w-full animate-fade-in">
            <div className="flex-1 flex items-center bg-white rounded-full h-10 px-4 shadow-inner border border-gray-100">
              <span className="material-symbols-outlined text-primary text-lg">search</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm ml-2 flex-1 outline-none text-text"
                placeholder="搜索书名、作者或昵称..."
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="flex items-center">
                  <span className="material-symbols-outlined text-text-muted text-lg">cancel</span>
                </button>
              )}
            </div>
            <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-primary text-sm font-bold px-2 whitespace-nowrap active:scale-95 transition-all">取消</button>
          </div>
        )}
      </header>

      {!isSearching && (
        <div className="px-4 py-4">
          <div
            onClick={() => { setEditFormData({ ...user }); setShowEditProfile(true); }}
            className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer relative group"
          >
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-text-muted text-lg">edit_note</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <img src={user.avatar} className="size-16 rounded-full border-2 border-primary object-cover" />
              <div>
                <h1 className="text-xl font-bold text-text">{user.name}</h1>
                <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-0.5">{user.level}级 · {user.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">旅行里程</span>
                <span className="text-2xl font-bold text-text">1,240 <span className="text-xs font-normal">km</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">累计传阅</span>
                <span className="text-2xl font-bold text-text">{circulatedBooks.length + hostedBooks.length} <span className="text-xs font-normal">本</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isSearching && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-text font-bold text-sm">成就勋章</h3>
            <button onClick={() => setShowMedalsGallery(true)} className="text-primary text-[10px] font-bold uppercase tracking-widest">查看全部</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {ALL_MEDALS.filter(m => m.unlocked).slice(0, 5).map(medal => (
              <div
                key={medal.id}
                onClick={() => setSelectedMedal(medal)}
                className={`shrink-0 size-14 rounded-2xl bg-gradient-to-br ${medal.color} flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer`}
              >
                <span className="material-symbols-outlined text-white text-2xl font-bold fill-icon">{medal.icon}</span>
              </div>
            ))}
            <div className="shrink-0 size-14 rounded-2xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 text-xl">lock</span>
            </div>
          </div>
        </div>
      )}

      <div className="px-4">
        <div className="flex border-b border-gray-100 mb-4">
          <button onClick={() => setActiveSubTab('hosting')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeSubTab === 'hosting' ? 'border-primary text-primary' : 'border-transparent text-text-muted'}`}>
            正在接待 ({searchQuery ? filteredHostedBooks.length : hostedBooks.length})
          </button>
          <button onClick={() => setActiveSubTab('circulated')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeSubTab === 'circulated' ? 'border-primary text-primary' : 'border-transparent text-text-muted'}`}>
            已传阅 ({searchQuery ? filteredCirculatedBooks.length : circulatedBooks.length})
          </button>
        </div>

        <div className="space-y-4 pb-24">
          {activeSubTab === 'hosting' ? (
            filteredHostedBooks.length > 0 ? (
              filteredHostedBooks.map((book, i) => {
                const progress = getHostingProgress(book.id);
                return (
                  <div key={book.id} onClick={() => onBookClick?.(book.id)} className="flex gap-4 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 animate-slide-up cursor-pointer active:scale-[0.98] transition-all">
                    <img src={book.cover} className="w-20 h-28 rounded-xl object-cover shadow-sm" alt="" />
                    <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                      <div>
                        <h4 className="font-bold text-text text-base truncate">{book.title}</h4>
                        <p className="text-[11px] text-text-muted mt-1 truncate">{book.author}</p>
                      </div>

                      <div className="my-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">接待时长</span>
                          <span className="text-[9px] font-bold text-text-muted">{progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-primary flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                          {book.status}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleInitiateHandover(e, i)}
                            className="flex-1 py-2 bg-primary text-black rounded-lg text-[11px] font-bold active:scale-95 transition-all shadow-sm"
                          >
                            发起传阅
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSharingBook(book); }}
                            className="px-3 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">forum</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 flex flex-col items-center opacity-40 animate-fade-in">
                <span className="material-symbols-outlined text-6xl text-text-muted mb-4">{searchQuery ? 'search_off' : 'inventory_2'}</span>
                <p className="text-sm font-bold text-text-muted">
                  {searchQuery ? `未找到与“${searchQuery}”相关的接待书籍` : '驿站空空如也，去发现新书吧'}
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="mt-4 text-primary text-xs font-bold underline">清除搜索条件</button>
                )}
              </div>
            )
          ) : (
            filteredCirculatedBooks.length > 0 ? (
              filteredCirculatedBooks.map((book) => (
                <div key={book.id} onClick={() => onBookClick?.(book.id)} className="flex gap-4 p-3 bg-white/60 rounded-2xl border border-gray-50 opacity-80 animate-slide-up cursor-pointer active:scale-[0.98] transition-all">
                  <img src={book.cover} className="w-16 h-24 rounded-xl object-cover grayscale" alt="" />
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <h4 className="font-bold text-text text-sm truncate">{book.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text-muted font-bold px-2 py-0.5 bg-gray-100 rounded-full">{book.status}</span>
                      <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">route</span>
                        {book.distance}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-2 font-medium">接收人: {book.receiver}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center opacity-40 animate-fade-in">
                <span className="material-symbols-outlined text-6xl text-text-muted mb-4">{searchQuery ? 'search_off' : 'history_edu'}</span>
                <p className="text-sm font-bold text-text-muted">
                  {searchQuery ? `未找到与“${searchQuery}”相关的传阅记录` : '尚无传阅书籍记录'}
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="mt-4 text-primary text-xs font-bold underline">清除搜索条件</button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[200] bg-white animate-slide-up flex flex-col">
          <header className="p-4 flex items-center justify-between border-b border-gray-50 sticky top-0 bg-white z-10">
            <button onClick={() => setShowEditProfile(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 active:scale-90">
              <span className="material-symbols-outlined text-text">close</span>
            </button>
            <h2 className="text-text font-bold text-lg">编辑个人资料</h2>
            <button form="edit-profile-form" className="text-primary font-bold text-sm px-4 active:scale-95">保存</button>
          </header>

          <form id="edit-profile-form" onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <img src={editFormData.avatar} className="size-24 rounded-full border-4 border-background object-cover shadow-xl" />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                </div>
              </div>
              <p className="mt-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">点击更换头像</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">昵称</label>
                <input
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full bg-background border-none rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text font-bold"
                  placeholder="你的展示名称"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">职位/头衔</label>
                <input
                  value={editFormData.role}
                  onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                  className="w-full bg-background border-none rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text font-medium"
                  placeholder="例如：高级设计师"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">个人简介</label>
                <textarea
                  value={editFormData.bio}
                  onChange={e => setEditFormData({...editFormData, bio: e.target.value})}
                  className="w-full bg-background border-none rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text text-sm h-32 resize-none"
                  placeholder="写点什么介绍你自己吧..."
                />
              </div>
            </div>
          </form>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[200] bg-background animate-slide-up flex flex-col">
          <header className="p-4 flex items-center justify-between bg-white border-b border-gray-50 sticky top-0 z-10">
            <button onClick={() => setShowSettings(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 active:scale-90">
              <span className="material-symbols-outlined text-text">arrow_back</span>
            </button>
            <h2 className="text-text font-bold text-lg">设置中心</h2>
            <div className="w-10"></div>
          </header>

          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            <section className="bg-white px-6 py-2">
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 mt-4">偏好设置</h3>
              <div className="divide-y divide-gray-50">
                <div className="flex items-center justify-between py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text">推送通知</span>
                    <span className="text-[10px] text-text-muted">接收书籍到达与申请提醒</span>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, pushNotifications: !settings.pushNotifications})}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.pushNotifications ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 size-4 rounded-full bg-white transition-all ${settings.pushNotifications ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text">隐身模式</span>
                    <span className="text-[10px] text-text-muted">在书籍旅行足迹中隐藏我的名字</span>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, privacyMode: !settings.privacyMode})}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.privacyMode ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 size-4 rounded-full bg-white transition-all ${settings.privacyMode ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-white px-6 py-2">
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 mt-4">账号安全</h3>
              <div className="divide-y divide-gray-50">
                <button className="w-full flex items-center justify-between py-4 group active:bg-gray-50">
                  <span className="text-sm font-bold text-text">修改登录密码</span>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
                <button className="w-full flex items-center justify-between py-4 group active:bg-gray-50">
                  <span className="text-sm font-bold text-text">黑名单管理</span>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
              </div>
            </section>

            <section className="px-6 space-y-3 pt-6 pb-12">
              <button className="w-full py-4 bg-white border border-gray-100 rounded-2xl text-text-muted font-bold text-sm active:scale-95 transition-all">
                清理缓存 (24.8 MB)
              </button>
              <button
                onClick={onLogout}
                className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              >
                退出当前账号
              </button>
              <p className="text-center text-[10px] text-text-muted opacity-50 font-bold uppercase tracking-widest">Version 2.4.0 (Build 2024)</p>
            </section>
          </div>
        </div>
      )}

      {selectedMedal && (
        <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedMedal(null)}>
          <div className="bg-white rounded-[40px] w-full max-sm p-8 shadow-2xl animate-zoom-in text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${selectedMedal.color} opacity-10`}></div>

             <div className={`size-24 rounded-3xl bg-gradient-to-br ${selectedMedal.color} flex items-center justify-center mx-auto shadow-2xl mb-6 relative z-10`}>
                <span className="material-symbols-outlined text-white text-5xl font-bold fill-icon">{selectedMedal.icon}</span>
             </div>

             <h3 className="text-2xl font-bold text-text mb-2">{selectedMedal.label}</h3>
             <p className="text-primary text-[10px] font-bold uppercase tracking-widest mb-6">
                {selectedMedal.unlocked ? `于 ${selectedMedal.unlockDate} 获得` : '尚未达成'}
             </p>

             <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter mb-1">成就介绍</p>
                <p className="text-sm text-text leading-relaxed font-medium">{selectedMedal.description}</p>
             </div>

             <div className="bg-primary/10 rounded-2xl p-4 text-left">
                <p className="text-[10px] font-bold text-primary uppercase tracking-tighter mb-1">达成要求</p>
                <p className="text-xs text-text/80">{selectedMedal.requirement}</p>
             </div>

             <button onClick={() => setSelectedMedal(null)} className="w-full mt-8 py-4 bg-primary text-black rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">
               收起详情
             </button>
          </div>
        </div>
      )}

      {showMedalsGallery && (
        <div className="fixed inset-0 z-[200] bg-background animate-slide-up flex flex-col">
          <header className="p-4 flex items-center justify-between bg-white border-b border-gray-50 sticky top-0 z-10">
            <button onClick={() => setShowMedalsGallery(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 active:scale-90">
              <span className="material-symbols-outlined text-text">close</span>
            </button>
            <h2 className="text-text font-bold text-lg">勋章展示馆</h2>
            <div className="w-10"></div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6 pb-12">
             {ALL_MEDALS.map(medal => (
               <div key={medal.id} onClick={() => setSelectedMedal(medal)} className="flex flex-col items-center gap-3 active:scale-90 transition-all cursor-pointer">
                 <div className={`size-20 rounded-[28px] bg-gradient-to-br ${medal.unlocked ? medal.color : 'from-gray-100 to-gray-200'} flex items-center justify-center shadow-lg relative`}>
                    <span className={`material-symbols-outlined text-3xl font-bold ${medal.unlocked ? 'text-white fill-icon' : 'text-gray-400'}`}>
                      {medal.icon}
                    </span>
                    {!medal.unlocked && <span className="absolute -top-1 -right-1 size-6 bg-white rounded-full flex items-center justify-center shadow-sm text-[12px] text-gray-400 font-bold border border-gray-100">?</span>}
                 </div>
                 <span className={`text-[11px] font-bold text-center ${medal.unlocked ? 'text-text' : 'text-gray-400'}`}>{medal.label}</span>
               </div>
             ))}
          </div>
        </div>
      )}

      {showHandover && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end animate-fade-in">
          <div className="w-full bg-white rounded-t-[40px] p-6 pb-12 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>

            {handoverStep === 'form' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-text">书籍传阅交接</h2>
                <div className="flex gap-4 p-4 bg-background rounded-3xl border border-gray-100">
                  <img src={hostedBooks[selectedBookIndex!]?.cover} className="w-14 h-20 rounded-xl shadow-sm" />
                  <div className="flex flex-col justify-center">
                    <h4 className="font-bold text-text">{hostedBooks[selectedBookIndex!]?.title}</h4>
                    <p className="text-[10px] text-text-muted mt-1 uppercase">接力代号: #TRAVEL-{Math.floor(Math.random()*10000)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">给下位读者的寄语</label>
                  <textarea
                    value={handoverData.note}
                    onChange={e => setHandoverData({...handoverData, note: e.target.value})}
                    className="w-full bg-background rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all h-24 resize-none"
                    placeholder="分享你的阅读感受，或者是对下一站的期待..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">选择交接方式</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setHandoverData({...handoverData, method: 'qrcode'})} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${handoverData.method === 'qrcode' ? 'border-primary bg-primary/5' : 'border-gray-50'}`}>
                      <span className="material-symbols-outlined text-primary">qr_code_2</span>
                      <span className="text-xs font-bold">扫码交接</span>
                    </button>
                    <button onClick={() => setHandoverData({...handoverData, method: 'station'})} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${handoverData.method === 'station' ? 'border-primary bg-primary/5' : 'border-gray-50'}`}>
                      <span className="material-symbols-outlined text-primary">local_post_office</span>
                      <span className="text-xs font-bold">驿站投递</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowHandover(false)} className="flex-1 py-4 rounded-2xl font-bold text-sm bg-gray-50 text-text-muted active:scale-95 transition-all">取消</button>
                  <button onClick={confirmHandoverAction} className="flex-[2] py-4 rounded-2xl font-bold text-sm bg-primary text-black shadow-lg shadow-primary/20 active:scale-95 transition-all">生成接力任务</button>
                </div>
              </div>
            )}

            {handoverStep === 'processing' && (
              <div className="flex flex-col items-center py-12 space-y-6">
                <div className="relative size-32">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                  <div className="relative z-10 size-full bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-text">正在{handoverData.method === 'qrcode' ? '生成交接凭证' : '同步驿站状态'}</h3>
                  <p className="text-text-muted text-sm mt-2">请稍后，正在加密书籍旅行数据...</p>
                </div>
              </div>
            )}

            {handoverStep === 'success' && (
              <div className="space-y-8 py-4 animate-zoom-in">
                {handoverData.method === 'qrcode' ? (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="size-20 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
                        <span className="material-symbols-outlined text-white text-4xl font-bold">check</span>
                      </div>
                      <h3 className="text-2xl font-bold text-text">扫码交接已就绪</h3>
                      <p className="text-text-muted text-sm mt-1">请对方使用 BookTravel 扫描下方二维码</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-gray-100 flex flex-col items-center relative overflow-hidden">
                      <div className="size-48 bg-background rounded-3xl flex items-center justify-center border-4 border-primary/20 relative overflow-hidden">
                        <img src="https://placehold.co/300x300/ffffff/13ec92?text=BOOK+CODE" className="size-40 rounded-xl" />
                        <div className="absolute inset-x-0 top-0 h-1 bg-primary/40 animate-scan-move"></div>
                      </div>
                      <div className="mt-6 text-center">
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">离线核销码</p>
                        <p className="text-xl font-mono font-bold text-text mt-1">8829 - 4910</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="size-20 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
                        <span className="material-symbols-outlined text-white text-4xl font-bold">local_post_office</span>
                      </div>
                      <h3 className="text-2xl font-bold text-text">投递指引</h3>
                      <p className="text-text-muted text-sm mt-1">请将书籍放入以下驿站储物柜</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100 space-y-6">
                      <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        <div className="flex-1">
                          <h4 className="font-bold text-text text-sm">3F 智能驿站 - A区</h4>
                          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">深圳市南山区腾讯滨海大厦 3 楼休闲区 02 号柜</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-background rounded-2xl">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">开启指令</span>
                          <span className="text-lg font-bold text-text"># 3209 *</span>
                        </div>
                        <button className="flex items-center gap-1.5 text-primary text-[11px] font-bold active:scale-95">
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                          复制指令
                        </button>
                      </div>

                      {handoverData.note && (
                        <div className="p-4 border border-dashed border-gray-200 rounded-2xl italic">
                           <p className="text-[10px] font-bold text-text-muted uppercase mb-1">您的留言</p>
                           <p className="text-xs text-text-muted">“{handoverData.note}”</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-3">
                  <button onClick={() => setShowHandover(false)} className="w-full py-4 rounded-2xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">
                    {handoverData.method === 'qrcode' ? '完成交接' : '我已投递书籍'}
                  </button>
                  <p className="text-center text-[10px] text-text-muted font-bold">完成后，书籍将自动移动至“已传阅”列表</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {sharingBook && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end animate-fade-in">
          <div className="w-full bg-white rounded-t-[32px] p-6 pb-10 animate-slide-up shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-text mb-2">发布到书友圈</h2>
            <p className="text-text-muted text-sm mb-6">分享你对《{sharingBook.title}》的接待感悟。</p>
            <textarea
              autoFocus
              value={shareContent}
              onChange={e => setShareContent(e.target.value)}
              className="w-full bg-background rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 h-32 resize-none"
              placeholder="写下你的感悟..."
            />
            <div className="flex gap-4 pt-6">
              <button onClick={() => setSharingBook(null)} className="flex-1 py-4 bg-gray-100 rounded-xl font-bold active:scale-95">取消</button>
              <button
                onClick={() => {
                   onShare?.({
                      userName: user.name,
                      targetUser: '全体书友',
                      avatar1: user.avatar,
                      avatar2: 'https://picsum.photos/seed/globe/100/100',
                      location: '深圳总部',
                      bookTitle: sharingBook.title,
                      content: shareContent,
                      image1: sharingBook.cover,
                      image2: 'https://picsum.photos/seed/share/400/400'
                   });
                   setSharingBook(null);
                }}
                disabled={!shareContent.trim()}
                className="flex-[2] py-4 bg-primary text-black rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-all"
              >
                发布动态
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes scanMove { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan-move { position: absolute; width: 100%; height: 2px; background: rgba(19, 236, 146, 0.8); box-shadow: 0 0 10px rgba(19, 236, 146, 0.8); animation: scanMove 2s linear infinite; }
      `}</style>
    </div>
  );
};

export default Station;
