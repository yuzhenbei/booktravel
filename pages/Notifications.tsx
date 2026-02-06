
import React, { useState } from 'react';

export interface NotificationItem {
  id: string;
  type: 'handover' | 'interaction' | 'system';
  title: string;
  content: string;
  time: string;
  unread: boolean;
  avatar?: string;
}

interface NotificationsProps {
  onBack: () => void;
  notifications: NotificationItem[];
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onBack, notifications, markRead, markAllRead }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const displayedNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.unread);

  const handleItemClick = (id: string) => {
    markRead(id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'handover': return 'rocket_launch';
      case 'interaction': return 'favorite';
      case 'system': return 'campaign';
      default: return 'notifications';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'handover': return 'bg-primary/20 text-primary';
      case 'interaction': return 'bg-pink-100 text-pink-500';
      case 'system': return 'bg-blue-100 text-blue-500';
      default: return 'bg-gray-100 text-text-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background animate-slide-up flex flex-col">
      <header className="sticky top-0 z-50 flex items-center bg-white/80 backdrop-blur-md p-4 justify-between border-b border-gray-50">
        <button onClick={onBack} className="text-text flex size-10 items-center">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-text text-lg font-bold">消息通知</h2>
        <button 
          onClick={markAllRead}
          className="text-primary text-xs font-bold px-2 py-1 rounded-lg hover:bg-primary/5 active:scale-95 transition-all"
        >
          一键已读
        </button>
      </header>

      <div className="px-4 py-3 flex gap-4 bg-white/50 backdrop-blur-sm">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'all' ? 'bg-primary text-black' : 'text-text-muted bg-white border border-gray-100'
          }`}
        >
          全部消息
        </button>
        <button 
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all relative ${
            activeTab === 'unread' ? 'bg-primary text-black' : 'text-text-muted bg-white border border-gray-100'
          }`}
        >
          未读
          {notifications.some(n => n.unread) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-10">
        {displayedNotifications.length > 0 ? (
          displayedNotifications.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`p-4 rounded-2xl flex gap-4 transition-all animate-slide-up active:scale-[0.98] ${
                item.unread ? 'bg-white shadow-md border-l-4 border-primary' : 'bg-white/60 opacity-80 border-l-4 border-transparent'
              }`}
            >
              <div className="relative shrink-0">
                {item.avatar ? (
                  <img src={item.avatar} className="size-11 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                ) : (
                  <div className={`size-11 rounded-full flex items-center justify-center ${getTypeColor(item.type)}`}>
                    <span className="material-symbols-outlined text-xl">{getTypeIcon(item.type)}</span>
                  </div>
                )}
                {item.unread && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-bold truncate ${item.unread ? 'text-text' : 'text-text-muted'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-text-muted whitespace-nowrap">{item.time}</span>
                </div>
                <p className={`text-xs leading-relaxed line-clamp-2 ${item.unread ? 'text-text-muted' : 'text-text-muted/60 font-normal'}`}>
                  {item.content}
                </p>
                {item.type === 'handover' && item.unread && (
                  <button className="mt-3 px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold active:scale-95">
                    立即处理
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">mail_outline</span>
            <p className="text-sm font-bold">暂无通知</p>
          </div>
        )}
      </div>

      <style>{`
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Notifications;
