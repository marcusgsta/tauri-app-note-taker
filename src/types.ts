
export interface NoteLink {
  source: string;
  target: string;
  text: string;
}

export interface Note {
  id: string,
  title: string,
  content: string,
  links?: NoteLink[];
}
