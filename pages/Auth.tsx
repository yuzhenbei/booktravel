
import React, { useState } from 'react';
import { authService } from '../src/services/auth';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLoginView) {
        const { error } = await authService.signIn(formData.email, formData.password);
        if (error) throw error;
      } else {
        const { error } = await authService.signUp(formData.email, formData.password, formData.username);
        if (error) throw error;
      }
      // Auth state change will be handled by AuthContext
      onLogin(); // Optional: kept for compatibility
    } catch (err: any) {
      alert(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-sm z-10 flex flex-col items-center">
        {/* Logo Section */}
        <div className="mb-10 text-center animate-slide-up">
          <div className="size-20 bg-primary rounded-[28px] flex items-center justify-center shadow-xl shadow-primary/20 mx-auto mb-4">
            <span className="material-symbols-outlined text-black text-4xl font-bold">auto_stories</span>
          </div>
          <h1 className="text-3xl font-bold text-text tracking-tight">书境 <span className="text-primary">BookTravel</span></h1>
          <p className="text-text-muted text-sm mt-2 font-medium">连接每一本好书，开启智慧旅程</p>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-white/80 backdrop-blur-xl rounded-[40px] p-8 shadow-2xl border border-white/50 animate-slide-up">
          <div className="flex mb-8 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setIsLoginView(true)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${isLoginView ? 'bg-white text-text shadow-sm' : 'text-text-muted'}`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLoginView(false)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${!isLoginView ? 'bg-white text-text shadow-sm' : 'text-text-muted'}`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLoginView && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">用户名</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg">person</span>
                  <input
                    required
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-background/50 border-none rounded-2xl py-4 pl-12 pr-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text font-bold text-sm"
                    placeholder="你的名字"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">邮箱或账号</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg">mail</span>
                <input
                  required
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-background/50 border-none rounded-2xl py-4 pl-12 pr-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text font-bold text-sm"
                  placeholder="example@book.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">密码</label>
                {isLoginView && (
                  <button type="button" className="text-[10px] font-bold text-primary uppercase">忘记密码？</button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg">lock</span>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-background/50 border-none rounded-2xl py-4 pl-12 pr-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text font-bold text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-primary text-black font-bold text-base shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                isLoginView ? '立即登录' : '开启旅程'
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] flex-1 bg-gray-100"></div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">或者通过</span>
              <div className="h-[1px] flex-1 bg-gray-100"></div>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 h-12 rounded-xl border border-gray-100 flex items-center justify-center bg-white active:scale-95 transition-all">
                <img src="https://www.google.com/favicon.ico" className="size-5 grayscale" alt="Google" />
              </button>
              <button className="flex-1 h-12 rounded-xl border border-gray-100 flex items-center justify-center bg-white active:scale-95 transition-all">
                <span className="material-symbols-outlined text-text text-xl">account_circle</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-text-muted text-xs font-medium">
          登录即代表你同意我们的 <button className="text-primary font-bold">服务协议</button> 和 <button className="text-primary font-bold">隐私政策</button>
        </p>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Auth;
