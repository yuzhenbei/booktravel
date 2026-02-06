
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { bookService } from '../services/bookService';
import { Book } from '../types';

interface ShelfBook {
  id: string;
  title: string;
  author: string;
  type: 'corporate' | 'personal';
  category: string;
  location: string;
  status: 'available' | 'traveling';
  cover: string;
  createdAt: number;
}

const CATEGORIES = ['全部', '文学', '科技', '心理', '传记', '经管', '科普'];

type SortKey = 'title' | 'author' | 'date';

interface ShelfProps {
  onBookClick: (id: string) => void;
}

const Shelf: React.FC<ShelfProps> = ({ onBookClick }) => {
  const [activeSegment, setActiveSegment] = useState<'corporate' | 'personal'>('corporate');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [isScanning, setIsScanning] = useState(false);

  const [allBooks, setAllBooks] = useState<ShelfBook[]>([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await bookService.fetchBooks();
        // Map Book to ShelfBook
        // This is a simplified mapping. In a real app we might determine 'type' based on owner.
        const mappedBooks: ShelfBook[] = data.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          type: 'corporate', // Default to corporate for now as we don't have distinct owner logic yet
          category: '文学', // Default category as schema didn't have it
          location: b.location || 'Unknown',
          status: b.status === 'reserved' ? 'available' : b.status,
          cover: b.cover || '',
          createdAt: Date.now() // specific date not in Book interface yet, using now
        }));
        setAllBooks(mappedBooks);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBooks();
  }, []);

  const [formData, setFormData] = useState({ title: '', author: '', category: '文学', cover: '' });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 进度计算工具函数
  const getProgress = (id: string) => {
    // 基于 ID 生成一个确定的伪随机进度值 (30% - 90%)
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 30 + (hash % 61);
  };

  // 封面生成函数
  const generatePlaceholderCover = (title: string, author: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const getHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    };

    const hash = getHash(title || 'BookTravel');
    const hue = Math.abs(hash % 360);

    const gradient = ctx.createLinearGradient(0, 0, 400, 600);
    gradient.addColorStop(0, `hsl(${hue}, 70%, 85%)`);
    gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 60%, 75%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);

    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#000';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 400, Math.random() * 600, 50 + Math.random() * 150, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.font = 'bold 20px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.fillText('BOOK TRAVEL', 200, 50);

    ctx.fillStyle = '#111815';
    ctx.textAlign = 'center';

    const displayTitle = title || '书名占位符';
    const words = displayTitle.split('');
    let line = '';
    let y = 260;
    const lineHeight = 55;

    ctx.font = 'bold 44px PingFang SC, sans-serif';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > 320 && n > 0) {
        ctx.fillText(line, 200, y);
        line = words[n];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 200, y);

    if (author) {
      ctx.font = '500 24px PingFang SC, sans-serif';
      ctx.fillStyle = 'rgba(17, 24, 21, 0.6)';
      ctx.fillText(author, 200, y + 80);
    }

    ctx.strokeStyle = 'rgba(17, 24, 21, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, y + 40);
    ctx.lineTo(300, y + 40);
    ctx.stroke();

    return canvas.toDataURL('image/png');
  };

  useEffect(() => {
    if (showAddModal && !isScanning) {
      const dataUrl = generatePlaceholderCover(formData.title, formData.author);
      setFormData(prev => ({ ...prev, cover: dataUrl }));
    }
  }, [formData.title, formData.author, showAddModal, isScanning]);

  const filteredBooks = useMemo(() => {
    let result = allBooks.filter(book => {
      const matchType = book.type === activeSegment;
      const matchCategory = activeCategory === '全部' || book.category === activeCategory;
      const matchSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchCategory && matchSearch;
    });

    return result.sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title, 'zh-CN');
      if (sortKey === 'author') return a.author.localeCompare(b.author, 'zh-CN');
      if (sortKey === 'date') return b.createdAt - a.createdAt;
      return 0;
    });
  }, [allBooks, activeSegment, activeCategory, searchQuery, sortKey]);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        title: '人类简史',
        author: '尤瓦尔·赫拉利',
        category: '科普'
      }));
      setIsScanning(false);
    }, 1500);
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const newBook: ShelfBook = {
      id: `p-${Date.now()}`,
      title: formData.title,
      author: formData.author,
      type: 'personal',
      category: formData.category,
      location: '待定',
      status: 'available',
      cover: formData.cover || `https://picsum.photos/seed/${Date.now()}/400/600`,
      createdAt: Date.now()
    };
    setAllBooks([newBook, ...allBooks]);
    setShowAddModal(false);
    setFormData({ title: '', author: '', category: '文学', cover: '' });
    setActiveSegment('personal');
    setActiveCategory('全部');
  };

  const sortOptions = [
    { key: 'date', label: '添加日期' },
    { key: 'title', label: '书名标题' },
    { key: 'author', label: '作者姓名' },
  ];

  return (
    <div className="animate-fade-in pb-20">
      <canvas ref={canvasRef} width="400" height="600" className="hidden" />

      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {!isSearching ? (
          <>
            <button onClick={() => setIsSearching(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-text shadow-sm">
              <span className="material-symbols-outlined">search</span>
            </button>
            <h2 className="text-text text-lg font-bold">书架资产</h2>
            <button onClick={() => setShowAddModal(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined">add</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 w-full animate-fade-in">
            <div className="flex-1 flex items-center bg-white rounded-full h-10 px-4 shadow-inner border border-gray-100">
              <span className="material-symbols-outlined text-text-muted text-lg">search</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm ml-2 flex-1 outline-none"
                placeholder="搜索标题、作者..."
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <span className="material-symbols-outlined text-text-muted text-lg">close</span>
                </button>
              )}
            </div>
            <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-primary text-sm font-bold px-2 whitespace-nowrap">取消</button>
          </div>
        )}
      </header>

      <div className="px-4 py-2">
        <div className="flex h-11 items-center bg-gray-100 rounded-xl p-1 shadow-inner">
          <button onClick={() => setActiveSegment('corporate')} className={`flex-1 h-full rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeSegment === 'corporate' ? 'bg-white shadow-sm text-text' : 'text-text-muted'}`}>
            <span className="material-symbols-outlined text-[18px]">domain</span>
            公司资产
          </button>
          <button onClick={() => setActiveSegment('personal')} className={`flex-1 h-full rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeSegment === 'personal' ? 'bg-white shadow-sm text-text' : 'text-text-muted'}`}>
            <span className="material-symbols-outlined text-[18px]">person_check</span>
            个人共享
          </button>
        </div>
      </div>

      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${activeCategory === cat ? 'bg-primary border-primary text-black shadow-md shadow-primary/10' : 'bg-white border-gray-100 text-text-muted'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {activeSegment === 'corporate' ? `官方精选 (${filteredBooks.length})` : `我的共享 (${filteredBooks.length})`}
        </span>
        <button onClick={() => setShowSortModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm active:scale-95 transition-all">
          <span className="material-symbols-outlined text-sm text-primary">filter_list</span>
          <span className="text-[10px] font-bold text-text uppercase tracking-tight">
            按{sortOptions.find(o => o.key === sortKey)?.label}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-4 pb-8">
        {filteredBooks.map((book) => {
          const progress = getProgress(book.id);
          return (
            <div key={book.id} onClick={() => onBookClick(book.id)} className="flex flex-col gap-2.5 group cursor-pointer animate-slide-up">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all active:scale-[0.98]">
                <img src={book.cover} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                <div className={`absolute top-2 left-2 text-black text-[9px] font-bold px-2 py-0.5 rounded shadow-sm ${book.type === 'corporate' ? 'bg-primary' : 'bg-blue-400 text-white'}`}>
                  {book.type === 'corporate' ? '官方' : '个人'}
                </div>
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase">
                  {book.category}
                </div>
                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[9px] font-bold text-text flex items-center gap-1 shadow-sm">
                  <span className={`size-1.5 rounded-full ${book.status === 'available' ? 'bg-primary' : 'bg-orange-400'}`}></span>
                  {book.status === 'available' ? '在架' : '流通中'}
                </div>
              </div>
              <div className="px-1">
                <h4 className="text-text text-sm font-bold leading-tight line-clamp-1">{book.title}</h4>
                <p className="text-text-muted text-[10px] mt-1 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {book.location}
                </p>

                {/* 流通进度可视化 */}
                {book.status === 'traveling' && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">流通进度</span>
                      <span className="text-[9px] font-bold text-text-muted">{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-orange-300 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showSortModal && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-end animate-fade-in">
          <div className="w-full bg-white rounded-t-[32px] p-6 pb-10 animate-slide-up shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-text mb-6 px-2">排序方式</h2>
            <div className="space-y-2">
              {sortOptions.map((opt) => (
                <button key={opt.key} onClick={() => { setSortKey(opt.key as SortKey); setShowSortModal(false); }} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${sortKey === opt.key ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-text'}`}>
                  <span className="font-bold text-sm">{opt.label}</span>
                  {sortKey === opt.key && <span className="material-symbols-outlined text-primary fill-icon">check_circle</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSortModal(false)} className="w-full mt-6 py-4 rounded-xl font-bold text-sm text-text bg-gray-100 active:scale-95 transition-all">取消</button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-slide-up">
          <header className="p-4 flex items-center justify-between border-b border-gray-50 sticky top-0 bg-white z-10">
            <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50">
              <span className="material-symbols-outlined text-text">close</span>
            </button>
            <h2 className="text-text font-bold text-lg">共享新书籍</h2>
            <div className="w-10"></div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {isScanning ? (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-3xl relative overflow-hidden border-2 border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent animate-pulse"></div>
                <span className="material-symbols-outlined text-5xl text-primary animate-bounce">barcode_scanner</span>
                <p className="mt-4 text-sm font-bold text-text">正在扫描 ISBN...</p>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_#13ec92] animate-scan-line"></div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="flex justify-center mb-8">
                  <div className="relative w-40 h-56 rounded-xl overflow-hidden shadow-2xl border-4 border-white rotate-1">
                    {formData.cover ? (
                      <img src={formData.cover} className="w-full h-full object-cover" alt="Cover Preview" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-300">image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                  </div>
                </div>

                <div className="flex gap-4 mb-8">
                  <button onClick={handleScan} className="flex-1 flex flex-col items-center gap-2 p-4 bg-background rounded-2xl border border-gray-100 hover:border-primary/50 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-text-muted">photo_camera</span>
                    <span className="text-[10px] font-bold text-text">扫码获取</span>
                  </button>
                  <div className="flex-1 flex flex-col items-center gap-2 p-4 bg-primary/10 rounded-2xl border border-primary/20">
                    <span className="material-symbols-outlined text-2xl text-primary">edit_note</span>
                    <span className="text-[10px] font-bold text-primary">手动输入</span>
                  </div>
                </div>

                <form onSubmit={handleAddBook} className="space-y-6 pb-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">书名</label>
                    <input
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-background border-none rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text font-bold"
                      placeholder="书籍完整名称"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">作者</label>
                    <input
                      required
                      value={formData.author}
                      onChange={e => setFormData({ ...formData, author: e.target.value })}
                      className="w-full bg-background border-none rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text"
                      placeholder="原作者或译者"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">书籍分类</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                      {CATEGORIES.slice(1).map(cat => (
                        <button key={cat} type="button" onClick={() => setFormData({ ...formData, category: cat })} className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${formData.category === cat ? 'bg-primary border-primary text-black' : 'bg-white border-gray-100 text-text-muted'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full py-5 rounded-2xl bg-primary text-black font-bold text-base shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4">确认上架并共享</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanLine { 0% { top: 20%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 80%; opacity: 0; } }
        .animate-scan-line { animation: scanLine 2s ease-in-out infinite; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};

export default Shelf;
