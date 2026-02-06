
import React, { useState, useMemo } from 'react';
import { TRAVEL_HISTORY, MOCK_BOOKS, MOCK_RECOMMENDATIONS } from '../constants';
import { PostItem } from './Community';

interface BookPassportProps {
  bookId: string;
  onBack: () => void;
  onShare?: (post: Omit<PostItem, 'id' | 'time' | 'likes' | 'comments'>) => void;
}

const BookPassport: React.FC<BookPassportProps> = ({ bookId, onBack, onShare }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState('');

  // 综合查找书籍信息
  const currentBook = useMemo(() => {
    const allKnownBooks = [...MOCK_BOOKS, ...MOCK_RECOMMENDATIONS];
    // 如果是 Shelf 传来的 c1/p1 等 ID，这里做个 fallback 模拟
    const found = allKnownBooks.find(b => b.id === bookId);
    if (found) return found;
    
    // Fallback 模拟数据 (针对 Shelf 页面产生的 ID)
    return {
      id: bookId,
      title: bookId.startsWith('c') ? '设计心理学' : '三体',
      author: '未知作者',
      cover: `https://picsum.sh/seed/${bookId}/400/600`,
      nickname: '神秘旅人',
      location: '驿站待定',
      status: 'available' as const
    };
  }, [bookId]);

  const handleShare = () => {
    if (!shareContent.trim()) return;
    
    onShare?.({
      userName: 'Alex Chen',
      targetUser: '全体书友',
      avatar1: 'https://picsum.photos/seed/me/100/100',
      avatar2: 'https://picsum.photos/seed/globe/100/100',
      location: '深圳总部',
      bookTitle: currentBook.title,
      content: shareContent,
      image1: currentBook.cover,
      image2: `https://picsum.photos/seed/share_${bookId}/400/400`
    });
    
    setShowShareModal(false);
    onBack();
  };

  return (
    <div className="min-h-screen bg-background animate-slide-up relative">
      <header className="sticky top-0 z-50 flex items-center bg-white/80 backdrop-blur-md p-4 justify-between border-b border-gray-50">
        <button onClick={onBack} className="text-text flex size-10 items-center">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-text text-lg font-bold flex-1 text-center">旅行护照</h2>
        <button onClick={() => setShowShareModal(true)} className="text-text size-10 flex items-center justify-center active:scale-90 transition-transform">
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <div className="p-6 flex flex-col items-center">
        <div className="relative group">
          <div 
            className="w-40 h-56 bg-center bg-cover rounded-xl shadow-2xl border-4 border-white transform transition-transform group-hover:rotate-2 duration-500"
            style={{ backgroundImage: `url("${currentBook.cover}")` }}
          />
          <div className="absolute -bottom-3 -right-3 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            已旅行 {Math.floor(Math.random() * 1000) + 100} km
          </div>
        </div>

        <div className="mt-8 text-center w-full">
          <h1 className="text-text text-2xl font-bold tracking-tight">{currentBook.title}</h1>
          <p className="text-text-muted text-base font-medium mt-1">旅行昵称：{currentBook.nickname}</p>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="bg-primary/20 text-text text-[10px] font-bold px-3 py-1 rounded-full border border-primary/30 uppercase tracking-tighter">
              编号: #BK-{Math.floor(Math.random() * 9000) + 1000}
            </span>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-100 uppercase">
              {currentBook.title.includes('设计') ? '设计/艺术' : '经典文学'}
            </span>
          </div>

          <button 
            onClick={() => setShowShareModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">forum</span>
            分享到书友圈
          </button>
        </div>
      </div>

      <section className="mt-4 px-6">
        <h3 className="text-text text-lg font-bold flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">route</span> 足迹地图
        </h3>
        
        <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-50">
          {TRAVEL_HISTORY.map((node, index) => (
            <div key={index} className="grid grid-cols-[40px_1fr] gap-x-3 group">
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full shadow-sm transition-all ${
                  node.type === 'current' ? 'bg-primary text-black' : 'bg-gray-100 text-text-muted'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {node.type === 'start' ? 'corporate_fare' : node.type === 'transit' ? 'terminal' : 'campaign'}
                  </span>
                </div>
                {index < TRAVEL_HISTORY.length - 1 && (
                  <div className="w-[2px] bg-primary h-12 my-1 opacity-50"></div>
                )}
              </div>
              <div className="flex flex-col pt-1 pb-6">
                <div className="flex items-center gap-2">
                  <p className={`text-base font-bold ${node.type === 'current' ? 'text-text' : 'text-text-muted opacity-80'}`}>
                    {node.department}
                  </p>
                  {node.type === 'current' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                </div>
                <p className={`text-xs font-medium mt-0.5 ${node.type === 'current' ? 'text-primary' : 'text-text-muted opacity-60'}`}>
                  {node.type === 'current' ? `当前位置 - 接待人：${node.user}` : `${node.date} - 由 ${node.user} 发起`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 px-6 pb-24">
        <h3 className="text-text text-lg font-bold mb-3">首站寄语</h3>
        <div className="p-6 bg-primary/10 rounded-2xl border-l-4 border-primary italic relative shadow-sm">
          <span className="material-symbols-outlined absolute top-2 right-4 text-primary/20 text-4xl">format_quote</span>
          <p className="text-text text-sm leading-relaxed">
            “这本书改变了我对工作的看法。希望它能在漂流中遇到那个需要开启新思路的人。请在阅读时也留下你的印记！”
          </p>
          <p className="mt-4 text-[10px] font-bold text-text-muted">—— 初始拥有者留言</p>
        </div>
      </section>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end animate-fade-in">
          <div className="w-full bg-white rounded-t-[32px] p-6 pb-10 animate-slide-up shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            
            <h2 className="text-xl font-bold text-text mb-2">分享到书友圈</h2>
            <p className="text-text-muted text-sm mb-6">记录这一刻的阅读心境，寻找志同道合的书友。</p>

            <div className="space-y-6">
              <div className="flex gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                 <img src={currentBook.cover} className="w-14 h-20 rounded-lg object-cover shadow-sm" alt="" />
                 <div className="flex flex-col justify-center">
                   <h4 className="font-bold text-sm text-text">{currentBook.title}</h4>
                   <p className="text-[10px] text-text-muted mt-1 uppercase">编号: #BK-{Math.floor(Math.random()*9000)+1000}</p>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">感悟动态</label>
                <textarea 
                  autoFocus
                  value={shareContent}
                  onChange={e => setShareContent(e.target.value)}
                  className="w-full bg-background rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 border-none transition-all h-32 resize-none"
                  placeholder="写下你对这本书的看法，或者是此刻的心情..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-4 rounded-xl font-bold text-sm text-text-muted bg-gray-100 active:scale-95 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleShare}
                  disabled={!shareContent.trim()}
                  className="flex-[2] py-4 rounded-xl font-bold text-sm bg-primary text-black shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  确认发布动态
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="flex gap-3">
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex-1 bg-white border border-primary/20 text-primary py-4 rounded-xl font-bold text-base shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">forum</span>
            分享感悟
          </button>
          <button className="flex-[2] bg-primary text-black py-4 rounded-xl font-bold text-base shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[20px]">handshake</span>
            申请接待
          </button>
        </div>
      </div>
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default BookPassport;
