
export interface Message {
  role: 'user' | 'model';
  text: string;
}

export type View = 'chat' | 'image';
