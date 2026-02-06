
import { supabase } from '../lib/supabase';
import { Book } from '../types';

export const bookService = {
    async fetchBooks() {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Book[];
    },

    async getBook(id: string) {
        const { data, error } = await supabase
            .from('books')
            .select(`
        *,
        owner:profiles!owner_id(full_name, avatar_url),
        holder:profiles!current_holder_id(full_name, avatar_url)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async updateBookStatus(id: string, status: 'available' | 'traveling' | 'reserved', holderId?: string) {
        const updates: any = { status };
        if (holderId) updates.current_holder_id = holderId;

        const { error } = await supabase
            .from('books')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    }
};
