import { supabase } from '../lib/supabase';
import { Book, TravelNode } from '../../types';

export const bookService = {
  async getAllBooks() {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        owner:profiles!owner_id(username, avatar_url),
        holder:profiles!current_holder_id(username, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to match frontend types if necessary
    return data.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: b.cover_url,
      nickname: b.nickname,
      location: b.current_location,
      status: b.status,
      // Defaulting optional fields
      daysInTravel: 0,
      travelCount: 0
    })) as Book[];
  },

  async getBookById(id: string) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      author: data.author,
      cover: data.cover_url,
      nickname: data.nickname,
      location: data.current_location,
      status: data.status,
    } as Book;
  },

  async getTravelHistory(bookId: string) {
    const { data, error } = await supabase
      .from('travel_history')
      .select(`
        *,
        user:profiles(username, department)
      `)
      .eq('book_id', bookId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map((h: any) => ({
      department: h.user?.department || 'Unknown Dept',
      date: new Date(h.created_at).toLocaleDateString(),
      user: h.user?.username || 'Unknown User',
      type: h.action_type === 'receive' ? 'current' : h.action_type,
      note: h.note
    })) as TravelNode[];
  },

  async applyForBook(bookId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.rpc('apply_for_book', {
      book_uuid: bookId,
      user_uuid: user.id
    });

    if (error) throw error;
  },

  async createBook(book: Partial<Book>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Get user profile for location info
    const { data: profile } = await supabase.from('profiles').select('department').eq('id', user.id).single();
    const userLocation = profile?.department || '未知部门';

    const { data, error } = await supabase
      .from('books')
      .insert({
        title: book.title,
        author: book.author,
        cover_url: book.cover,
        nickname: book.nickname,
        owner_id: user.id,
        current_holder_id: user.id,
        current_location: userLocation,
        status: 'available'
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Add initial history record
    await supabase.from('travel_history').insert({
      book_id: data.id,
      user_id: user.id,
      action_type: 'start',
      department_snapshot: userLocation,
      location_snapshot: '初始上架',
      note: '书籍首次上架'
    });

    return data;
  }
};
