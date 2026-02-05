
import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { bookService } from '../src/services/books';
import { MOCK_BOOKS, MOCK_RECOMMENDATIONS } from '../constants';
import { Book } from '../types';

interface DiscoveryProps {
  onBookClick: (id: string) => void;
  onNotificationClick: () => void;
  hasUnread?: boolean;
}

const Discovery: React.FC<DiscoveryProps> = ({ onBookClick, onNotificationClick, hasUnread }) => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.username || user?.email?.split('@')[0] || '书友';
  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${userName}`;

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await bookService.getAllBooks();
        if (data && data.length > 0) {
          setBooks(data);
        }
      } catch (e) {
        console.error("Failed to load books", e);
      }
    };
    fetchBooks();
  }, []);

  // 模拟楼层坐标数据
  const mapPoints = [
    { id: '1', top: '25%', left: '30%', label: '4F 产品部', book: books[0] || MOCK_BOOKS[0] },
    { id: '2', top: '65%', left: '70%', label: '2F 人力资源部', book: books[1] || MOCK_BOOKS[1] },
    { id: '3', top: '40%', left: '60%', label: '5F 技术部', book: books[2] || MOCK_BOOKS[2] },
  ];

  return (
    <div className="animate-fade-in">
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/10">
             <img src={avatarUrl} className="w-8 h-8 rounded-full" />
          </div>
          <h2 className="text-text text-lg font-bold tracking-tight">书境 BookTravel</h2>
        </div>
        <button
          onClick={onNotificationClick}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-text relative active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">notifications</span>
          {hasUnread && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </header>

      <section className="px-4 pt-4 pb-2">
        <h1 className="text-text tracking-tight text-2xl font-bold leading-tight">
          早安，{userName}。<br />开启你的下一段阅读旅程吗？
        </h1>
      </section>

      <div className="px-4 py-4">
        <div className="flex w-full items-center bg-white rounded-xl shadow-sm h-12 border border-gray-100 px-4">
          <span className="material-symbols-outlined text-text-muted">search</span>
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 placeholder:text-text-muted text-base ml-2"
            placeholder="搜索书籍或旅行昵称"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-text text-xl font-bold">正在旅行的书</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-1 transition-all ${
              viewMode === 'list' ? 'bg-white text-text' : 'text-text-muted'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">list</span> 列表
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
              viewMode === 'map' ? 'bg-white text-text shadow-sm' : 'text-text-muted'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">map</span> 地图
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="flex overflow-x-auto px-4 pb-6 gap-4 no-scrollbar">
          {books.map((book) => (
            <div
              key={book.id}
              onClick={() => onBookClick(book.id)}
              className="flex-none w-44 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm active:scale-95 transition-transform animate-slide-up"
            >
              <div className="relative h-56">
                {book.status === 'available' && (
                  <div className="absolute top-2 left-2 z-10 bg-primary px-2 py-1 rounded-full text-[9px] font-bold text-black uppercase tracking-wider">
                    刚刚到达
                  </div>
                )}
                {book.daysInTravel && (
                  <div className="absolute top-2 left-2 z-10 bg-white/90 px-2 py-1 rounded-full text-[9px] font-bold text-text uppercase tracking-wider">
                    旅行中 {book.daysInTravel}天
                  </div>
                )}
                <img src={book.cover} className="w-full h-full object-cover" alt={book.title} />
              </div>
              <div className="p-3">
                <p className="text-text-muted text-[9px] font-bold uppercase tracking-widest mb-1 italic">“{book.nickname}”</p>
                <h4 className="text-text font-bold text-sm truncate">{book.title}</h4>
                <div className="flex items-center gap-1 mt-1.5 mb-2.5">
                  <span className="material-symbols-outlined text-primary text-[14px]">corporate_fare</span>
                  <span className="text-[11px] text-text-muted font-medium truncate">{book.location}</span>
                </div>
                <button className="w-full bg-primary hover:bg-primary/90 text-black py-2 rounded-lg text-xs font-bold transition-all">
                  申请接待
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 pb-6 animate-fade-in">
          <div className="relative w-full aspect-[4/3] bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
            {/* 模拟室内地图背景 */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(#13ec92 0.5px, transparent 0.5px)',
              backgroundSize: '20px 20px'
            }}></div>

            {/* 模拟楼层划分线 */}
            <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" preserveAspectRatio="none">
              <path d="M 0 50 Q 250 80 500 50" stroke="currentColor" fill="none" />
              <path d="M 0 150 Q 250 180 500 150" stroke="currentColor" fill="none" />
              <path d="M 0 250 Q 250 280 500 250" stroke="currentColor" fill="none" />
            </svg>

            {/* 地图标注点 */}
            {mapPoints.map(point => (
              <div
                key={point.id}
                className="absolute group transition-all"
                style={{ top: point.top, left: point.left }}
              >
                {/* 锚点标记 */}
                <div
                  onClick={() => onBookClick(point.book.id)}
                  className="relative cursor-pointer"
                >
                  <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="relative size-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-black font-bold">menu_book</span>
                  </div>
                </div>

                {/* 悬浮标签 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white px-3 py-2 rounded-xl shadow-xl border border-gray-50 flex flex-col gap-1 w-32 pointer-events-none group-hover:pointer-events-auto group-hover:scale-105 transition-transform origin-bottom">
                  <div className="flex items-center gap-1">
                    <img src={point.book.cover} className="size-6 rounded-md object-cover" />
                    <span className="text-[10px] font-bold text-text truncate">{point.book.title}</span>
                  </div>
                  <p className="text-[8px] text-text-muted flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[10px]">location_on</span>
                    {point.label}
                  </p>
                  {/* 小箭头 */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-gray-50 rotate-45 -mt-1"></div>
                </div>
              </div>
            ))}

            {/* 地图图例 */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-50 shadow-sm">
                <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-bold text-text-muted">3 本书籍正开放申请</span>
              </div>
            </div>

            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-50 shadow-sm flex flex-col gap-2">
               <button className="size-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-text-muted hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">add</span>
               </button>
               <button className="size-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-text-muted hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">remove</span>
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-2">
        <h2 className="text-text text-xl font-bold mb-4">大佬推荐</h2>
        <div className="space-y-4 pb-6">
          {MOCK_RECOMMENDATIONS.map((book) => (
            <div
              key={book.id}
              onClick={() => onBookClick(book.id)}
              className="flex gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
            >
              <img src={book.cover} className="w-20 h-24 rounded-lg object-cover shadow-sm" alt={book.title} />
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={book.recommendBy?.avatar} className="w-5 h-5 rounded-full border border-primary/20" alt="" />
                  <p className="text-text-muted text-[10px] font-medium truncate">
                    来自 {book.recommendBy?.name} ({book.recommendBy?.role}) 的推荐
                  </p>
                </div>
                <h4 className="text-text font-bold text-base leading-tight mb-1">{book.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-xs truncate">{book.author}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                  <span className="text-primary text-[10px] font-bold whitespace-nowrap">
                    {book.status === 'available' ? '现可申请' : '1位书友正在排队'}
                  </span>
                </div>
              </div>
              <button className="self-center p-2 rounded-full bg-gray-50 text-text">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Discovery;
