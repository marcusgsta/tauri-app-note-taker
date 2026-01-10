import { useCallback, useState, useMemo } from "react";
import TauriNoteService from "./TauriNoteService";
import { Note, NoteLink } from "./types";
import { createUniqueId } from "./utils";

export const useNotesStore = (noteService: TauriNoteService) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);

  const loadNotes = useCallback(async () => {
    const loadedNotes = await noteService.loadAll();
    setNotes(loadedNotes);
  }, [noteService])

  const deleteNote = useCallback(async (id: string) => {
    const note = notes.find((n) => n.id === id);
      
    if (!note) {
      console.log('Note not found');
      return;
    }
    setNotes((prevNotes) => prevNotes.filter((n) => n.id !== id));
    const filename = `${note.title}.txt`;
    await noteService.delete(filename);
  }, [noteService, notes]);

  // Update specific note
  const updateNoteContent = useCallback((
    id: string,
    title: string,
    content: string) => {

    setNotes((prevNotes: Note[]) =>
      prevNotes.map((note: Note) =>
        note.id === id
          ? { ...note, title, content }
          : note
      )
    );
  }, []);

  const updateNoteTitle = useCallback((
    id: string,
    title: string) => {

    setNotes((prevNotes: Note[]) =>
      prevNotes.map((note: Note) =>
        note.id === id
          ? { ...note, title }
          : note
      )
    );
  }, []);

  const createEmptyNote = useCallback(() => {
    let id = createUniqueId();
    const newNote = { id: id, title: id, content: '' };

    setNotes((prevNotes: Note[]) => {
      const exists = prevNotes.find(note => note.id === id);
      if (exists) {
        id = (parseInt(exists.id) + 1).toString();
        newNote.id = id;
        newNote.title = id;
      }

      return [...prevNotes, newNote]
    });

    return newNote;

  }, [])

  // Filter notes by search term
  const filterNotes = useCallback((searchTerm: string) => {
    if (!searchTerm) {
      setFilteredNotes([]);
      return;
    }
    const filtered = notes.filter((note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNotes(filtered);
  }, [notes]);

  // Select note by ID
  const selectNote = useCallback(
    (id: string) => {
      return notes.find((note) => note.id === id);

    }, [notes]);

  // Sorted notes (memoized)
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const idA = parseInt(a.id.match(/(\d+)/)?.[1] || '0');
      const idB = parseInt(b.id.match(/(\d+)/)?.[1] || '0');
      return idB - idA;
    })
  }, [notes]);

  const parseLinksFromContent = useCallback((content: string, noteId: string):
  NoteLink[] => {
    const links: NoteLink[] = [];
    // match [[WikiLink]] syntax          
    const wikiLinks = [...content.matchAll(/\[\[([^\]\|]+)(?:\|([^\]]+))?\]\]/g)];
    wikiLinks.forEach(match => {
      const targetTitle = match[1].trim();
      const displayText = match[2]?.trim() || targetTitle;
      // convert title to ID
      const targetId = targetTitle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ||
      targetTitle;
      links.push({ source: noteId, target: targetId, text: `[[${displayText}]` });
    });
    return links;
  }, []);

  return {
    notes,
    filteredNotes,
    loadNotes,
    deleteNote,
    updateNoteContent,
    updateNoteTitle,
    createEmptyNote,
    filterNotes,
    selectNote,
    sortedNotes,
    parseLinksFromContent,
  };
};