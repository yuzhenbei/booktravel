
import React, { useState } from 'react';
import { communityService } from '../src/services/community';

export interface CommentItem {
  id: string;
  userName: string;
  avatar: string;
  content: string;
  time: string;
}

export interface PostItem {
  id: string;
  userName: string;
  targetUser: string;
  avatar1: string;
  avatar2: string;
  time: string;
  location: string;
  bookTitle: string;
  content: string;
  likes: number;
  comments: number;
  image1: string;
  image2: string;
  commentsList?: CommentItem[];
  isLiked?: boolean;
  hasCoffee?: boolean;
  tag?: string; // 关联的话题标签
}

interface GroupItem {
  id: string;
  name: string;
  members: number;
  activeTopic: string;
  image: string;
  tag: string;
  isJoined?: boolean;
  isCreator?: boolean;
}

interface CommunityProps {
  posts: PostItem[];
  onNotificationClick?: () => void;
  hasUnread?: boolean;
}

const MOCK_GROUPS: GroupItem[] = [
  {
    id: 'g1',
    name: '深度阅读者联盟',
    members: 1240,
    activeTopic: '讨论：书籍如何重塑思维',
    image: 'https://picsum.photos/seed/group1/400/300',
    tag: '深度阅读',
    isJoined: true
  },
  {
    id: 'g2',
    name: '职场进化论',
    members: 856,
    activeTopic: '分享：沟通的艺术与逻辑',
    image: 'https://picsum.photos/seed/group2/400/300',
    tag: '职场干货'
  },
  {
    id: 'g3',
    name: '科技前沿探索',
    members: 2310,
    activeTopic: '热议：AI时代的阅读新常态',
    image: 'https://picsum.photos/seed/group3/400/300',
    tag: '科技',
    isJoined: false
  },
  {
    id: 'g4',
    name: '文学之光',
    members: 567,
    activeTopic: '鉴赏：古典文学的现代价值',
    image: 'https://picsum.photos/seed/group4/400/300',
    tag: '文学'
  }
];

const COMMUNITY_TAGS = ['全部', '跨部门交流', '职场干货', '深度阅读', '领导力'];
const GROUP_CATEGORIES = ['深度阅读', '职场干货', '科技前沿', '文学鉴赏', '心理健康', '生活方式'];

const Community: React.FC<CommunityProps> = ({ posts: initialPosts, onNotificationClick, hasUnread }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'groups'>('posts');
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [groups, setGroups] = useState<GroupItem[]>(MOCK_GROUPS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTag, setActiveTag] = useState('全部');

  // 互动反馈状态
  const [selectedPostForComments, setSelectedPostForComments] = useState<PostItem | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [coffeeSuccessPost, setCoffeeSuccessPost] = useState<PostItem | null>(null);

  // 创建小组表单数据
  const [createFormData, setCreateFormData] = useState({
    name: '',
    tag: GROUP_CATEGORIES[0],
    topic: '',
    cover: `https://picsum.photos/seed/${Math.random()}/400/300`
  });

  const toggleJoinGroup = (id: string) => {
    setGroups(prev => prev.map(g =>
      g.id === id ? { ...g, isJoined: !g.isJoined, members: g.isJoined ? g.members - 1 : g.members + 1 } : g
    ));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    setTimeout(() => {
      const newGroup: GroupItem = {
        id: `g-${Date.now()}`,
        name: createFormData.name,
        members: 1,
        activeTopic: createFormData.topic || '欢迎加入新小组，开启我们的阅读对话！',
        image: createFormData.cover,
        tag: createFormData.tag,
        isJoined: true,
        isCreator: true
      };

      setGroups([newGroup, ...groups]);
      setIsCreating(false);
      setShowCreateModal(false);
      setCreateFormData({
        name: '',
        tag: GROUP_CATEGORIES[0],
        topic: '',
        cover: `https://picsum.photos/seed/${Math.random()}/400/300`
      });
    }, 1500);
  };

  const openComments = async (post: PostItem) => {
    // 设置选中的帖子，并显示 loading 状态（可选）
    setSelectedPostForComments({ ...post, commentsList: [] });

    try {
      // 1. 获取真实评论
      const comments = await communityService.getComments(post.id);
      setSelectedPostForComments(prev => prev ? { ...prev, commentsList: comments } : null);
    } catch (e) {
      console.error("加载评论失败", e);
    }
  };

  const handleSendComment = async () => {
    if (!newCommentText.trim() || !selectedPostForComments) return;

    try {
      const newComment = await communityService.createComment(selectedPostForComments.id, newCommentText);

      const updatedCommentsList = [newComment, ...(selectedPostForComments.commentsList || [])];

      setSelectedPostForComments({
        ...selectedPostForComments,
        commentsList: updatedCommentsList,
        comments: selectedPostForComments.comments + 1
      });

      setPosts(prev => prev.map(p =>
        p.id === selectedPostForComments.id
          ? { ...p, comments: p.comments + 1, commentsList: updatedCommentsList }
          : p
      ));

      setNewCommentText('');
    } catch (e) {
      console.error("发送评论失败", e);
      alert("发送失败，请重试");
    }
  };

  const handleToggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likes: isLiked ? p.likes + 1 : p.likes - 1
        };
      }
      return p;
    }));
  };

  const handleGiftCoffee = (post: PostItem) => {
    setPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, hasCoffee: true } : p
    ));
    setCoffeeSuccessPost(post);
    // 自动关闭反馈弹窗
    setTimeout(() => setCoffeeSuccessPost(null), 3000);
  };

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    // 平滑滚动到顶部，以便用户看到过滤后的结果
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 根据当前 activeTag 过滤动态
  const filteredPosts = posts.filter(post => {
    if (activeTag === '全部') return true;
    return post.tag === activeTag;
  });

  return (
    <div className="animate-fade-in relative min-h-screen">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center p-4 justify-between">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10 overflow-hidden">
            <img src="https://picsum.photos/seed/me/100/100" className="size-8 rounded-full" alt="" />
          </div>
          <h1 className="text-text text-lg font-bold flex-1 text-center">书友圈</h1>
          <button
            onClick={onNotificationClick}
            className="relative w-10 h-10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-text">notifications</span>
            {hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
        <div className="flex px-4 gap-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`border-b-[3px] pb-3 pt-1 text-sm font-bold transition-all ${
              activeTab === 'posts' ? 'border-primary text-text' : 'border-transparent text-text-muted'
            }`}
          >
            动态
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`border-b-[3px] pb-3 pt-1 text-sm font-bold transition-all ${
              activeTab === 'groups' ? 'border-primary text-text' : 'border-transparent text-text-muted'
            }`}
          >
            同路人小组
          </button>
        </div>
      </header>

      {activeTab === 'posts' ? (
        <div className="animate-fade-in">
          {/* 顶部标签过滤栏 */}
          <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar">
            {COMMUNITY_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`flex h-8 shrink-0 items-center px-4 rounded-xl text-xs font-bold shadow-sm whitespace-nowrap transition-all active:scale-95 ${
                  activeTag === tag
                    ? 'bg-primary text-black border border-primary/20'
                    : 'bg-white text-text-muted border border-gray-100'
                }`}
              >
                {tag === '全部' ? tag : `# ${tag}`}
              </button>
            ))}
          </div>

          <div className="px-4 space-y-5 pb-10">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
                  <div className="p-4 flex items-center gap-3">
                    <div className="flex -space-x-3">
                      <img src={post.avatar1} className="size-10 rounded-full border-2 border-white object-cover" alt="" />
                      <img src={post.avatar2} className="size-10 rounded-full border-2 border-white object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text text-sm font-bold truncate">
                        {post.userName} <span className="text-primary font-medium mx-0.5">接力给</span> {post.targetUser}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-text-muted text-[10px] font-medium">{post.time} · {post.location}</p>
                        {post.time === '刚刚' && (
                          <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[8px] font-bold rounded-sm animate-pulse">NEW</span>
                        )}
                        {/* 动态卡片内可点击标签 */}
                        {post.tag && (
                          <button
                            onClick={() => handleTagClick(post.tag!)}
                            className="ml-2 text-primary text-[10px] font-bold px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10 hover:bg-primary/20 transition-colors"
                          >
                            #{post.tag}
                          </button>
                        )}
                      </div>
                    </div>
                    {post.hasCoffee && (
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full animate-bounce">
                        <span className="material-symbols-outlined text-amber-600 text-[14px] fill-icon">local_cafe</span>
                        <span className="text-amber-600 text-[9px] font-bold">+1</span>
                      </div>
                    )}
                  </div>

                  <div className="px-4 relative group">
                    <div className="grid grid-cols-2 gap-2 h-44 cursor-pointer" onDoubleClick={() => handleToggleLike(post.id)}>
                      <img src={post.image1} className="w-full h-full object-cover rounded-xl shadow-inner border border-gray-50" alt="" />
                      <img src={post.image2} className="w-full h-full object-cover rounded-xl shadow-inner border border-gray-50" alt="" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-active:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white text-6xl drop-shadow-xl animate-ping-fast fill-icon">favorite</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-text text-base font-bold mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">book_2</span>
                      《{post.bookTitle}》
                    </h3>
                    <div className="bg-primary/5 rounded-xl p-4 border-l-4 border-primary">
                      <p className="text-text-muted text-[13px] italic leading-relaxed">
                        “{post.content}”
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex gap-5">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1.5 transition-all group active:scale-125 ${post.isLiked ? 'text-red-500' : 'text-text-muted'}`}
                      >
                        <span className={`material-symbols-outlined text-[20px] ${post.isLiked ? 'fill-icon animate-pop' : ''}`}>favorite</span>
                        <span className="text-xs font-bold">{post.likes}</span>
                      </button>
                      <button
                        onClick={() => openComments(post)}
                        className="flex items-center gap-1.5 text-text-muted group active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                        <span className="text-xs font-bold">{post.comments}</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleGiftCoffee(post)}
                      className="flex items-center gap-1.5 px-4 h-9 bg-primary text-black rounded-full text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">coffee</span>
                      <span>赠送咖啡</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-24 opacity-40">
                <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-text-muted">history_edu</span>
                </div>
                <p className="text-sm font-bold text-text-muted">该分类下暂无动态</p>
                <p className="text-[10px] text-text-muted/60 mt-1">换个话题看看吧</p>
                <button
                  onClick={() => setActiveTag('全部')}
                  className="mt-6 px-6 py-2 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20 active:scale-95 transition-all"
                >
                  查看全部动态
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in p-4 space-y-6 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-text text-xl font-bold">推荐小组</h2>
            <button className="text-primary text-xs font-bold">查看更多</button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm flex flex-col animate-slide-up relative"
              >
                {group.isCreator && (
                  <div className="absolute top-4 right-4 z-10 bg-primary text-black px-2 py-1 rounded-lg text-[9px] font-bold uppercase shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">grade</span>
                    组长
                  </div>
                )}
                <div className="relative h-40">
                  <img src={group.image} className="w-full h-full object-cover" alt="" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-text uppercase tracking-wider">
                    {group.tag}
                  </div>
                </div>
                <div className="p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-text text-lg font-bold">{group.name}</h3>
                    <div className="flex items-center gap-1 text-text-muted">
                      <span className="material-symbols-outlined text-sm">group</span>
                      <span className="text-[11px] font-bold">{group.members} 成员</span>
                    </div>
                  </div>
                  <p className="text-text-muted text-xs font-medium mb-5 line-clamp-1 italic">
                    <span className="text-primary font-bold not-italic mr-1">TOPIC:</span>
                    {group.activeTopic}
                  </p>
                  <button
                    onClick={() => toggleJoinGroup(group.id)}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                      group.isJoined
                        ? 'bg-gray-100 text-text-muted'
                        : 'bg-primary text-black shadow-lg shadow-primary/20'
                    }`}
                  >
                    {group.isJoined ? '已加入小组' : '立即加入小组'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 rounded-[24px] p-6 border border-dashed border-primary/30 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-4xl text-primary mb-3">groups_3</span>
            <h4 className="text-text font-bold text-base mb-1">找不到心仪的小组？</h4>
            <p className="text-text-muted text-xs mb-4">创建属于你和书友们的同路人空间</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-white border border-primary/20 text-primary rounded-full text-xs font-bold active:scale-95 transition-all shadow-sm"
            >
              创建我的小组
            </button>
          </div>
        </div>
      )}

      {/* 咖啡赠送成功 反馈 */}
      {coffeeSuccessPost && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in" onClick={() => setCoffeeSuccessPost(null)}>
          <div className="bg-white rounded-[40px] w-full max-w-xs p-8 shadow-2xl animate-zoom-in text-center overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 inset-x-0 h-2 bg-amber-500/20"></div>
            <div className="size-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-coffee-float">
               <span className="material-symbols-outlined text-amber-600 text-5xl fill-icon">local_cafe</span>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">咖啡赠送成功！</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              你赠送的咖啡已经送达 <span className="text-primary font-bold">{coffeeSuccessPost.userName}</span>，感谢你为阅读旅程增添的温暖。
            </p>
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 italic">书友留言</p>
              <p className="text-xs text-amber-800/80">“一本书，一杯咖啡，就是最好的午后。谢谢你的礼物！”</p>
            </div>
            <button
              onClick={() => setCoffeeSuccessPost(null)}
              className="w-full mt-8 py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              太棒了
            </button>
          </div>
        </div>
      )}

      {/* 评论抽屉 (Comments Drawer) */}
      {selectedPostForComments && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end animate-fade-in" onClick={() => setSelectedPostForComments(null)}>
          <div
            className="w-full bg-white rounded-t-[32px] animate-slide-up flex flex-col shadow-2xl overflow-hidden h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 shrink-0"></div>

            <header className="px-6 pb-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-text text-lg font-bold">书友感悟评论</h2>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                   针对《{selectedPostForComments.bookTitle}》
                </p>
              </div>
              <button
                onClick={() => setSelectedPostForComments(null)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-text text-sm">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {selectedPostForComments.commentsList && selectedPostForComments.commentsList.length > 0 ? (
                selectedPostForComments.commentsList.map(comment => (
                  <div key={comment.id} className="flex gap-4 animate-slide-up">
                    <img src={comment.avatar} className="size-10 rounded-full border border-gray-100 object-cover" alt="" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-primary">{comment.userName}</h4>
                        <span className="text-[10px] text-text-muted font-medium">{comment.time}</span>
                      </div>
                      <p className="text-[13px] text-text leading-relaxed">
                        {comment.content}
                      </p>
                      <button className="mt-2 text-[10px] font-bold text-text-muted flex items-center gap-1 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-xs">reply</span>
                        回复他
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                  <span className="material-symbols-outlined text-5xl">chat_bubble_outline</span>
                  <p className="text-sm font-bold mt-2">虚位以待，快来发表第一条评论吧</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-50 bg-white sticky bottom-0">
              <div className="flex items-center gap-3 bg-background rounded-2xl px-4 h-12 border border-transparent focus-within:border-primary/30 transition-all">
                <input
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendComment()}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none text-text"
                  placeholder="写下你的共鸣..."
                />
                <button
                  onClick={handleSendComment}
                  disabled={!newCommentText.trim()}
                  className="text-primary font-bold text-sm disabled:opacity-30 transition-all"
                >
                  发布
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] bg-white animate-slide-up flex flex-col">
          <header className="p-4 flex items-center justify-between border-b border-gray-50 sticky top-0 bg-white z-10">
            <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 active:scale-90">
              <span className="material-symbols-outlined text-text">close</span>
            </button>
            <h2 className="text-text font-bold text-lg">创建我的小组</h2>
            <div className="w-10"></div>
          </header>

          <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-6 space-y-8 pb-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">小组封面</label>
                <div
                  className="w-full h-44 rounded-3xl overflow-hidden relative group cursor-pointer"
                  onClick={() => setCreateFormData({...createFormData, cover: `https://picsum.photos/seed/${Math.random()}/400/300`})}
                >
                  <img src={createFormData.cover} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                       <span className="material-symbols-outlined text-white text-sm">refresh</span>
                       <span className="text-white text-xs font-bold">更换随机封面</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">小组名称</label>
                <input
                  required
                  maxLength={20}
                  value={createFormData.name}
                  onChange={e => setCreateFormData({...createFormData, name: e.target.value})}
                  className="w-full bg-background border-none rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text font-bold"
                  placeholder="起一个响亮的名字"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">兴趣分类</label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCreateFormData({...createFormData, tag: cat})}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        createFormData.tag === cat
                          ? 'bg-primary border-primary text-black shadow-md shadow-primary/10'
                          : 'bg-white border-gray-100 text-text-muted'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">初始活跃话题</label>
                <textarea
                  value={createFormData.topic}
                  onChange={e => setCreateFormData({...createFormData, topic: e.target.value})}
                  className="w-full bg-background border-none rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text text-sm h-32 resize-none"
                  placeholder="写一个小话题来吸引第一批成员吧..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!createFormData.name || isCreating}
              className="w-full py-5 rounded-2xl bg-primary text-black font-bold text-base shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>正在同步小组数据...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">groups_3</span>
                  <span>确认创建并加入小组</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-ping-fast { animation: ping 0.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-coffee-float { animation: float 3s ease-in-out infinite; }
        .animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Community;
