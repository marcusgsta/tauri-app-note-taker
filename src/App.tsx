
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { OmniBar } from "./OmniBar";
import { Note } from "./types";
import { Notes } from "./Notes";
import { CurrentNote } from "./CurrentNote";
import TauriNoteService from "./TauriNoteService";
import { useNotesStore } from "./useNotesStore";

export default function Home() {

  const [currentNote, setCurrentNote] = useState<Note>({
    id: "", title: "", content: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [omniBarValue, setOmniBarValue] = useState('');
  const [originalFilename, setOriginalFilename] = useState('');

  const noteService = useMemo(() => new TauriNoteService(), []);

  const { 
    filteredNotes,
    filterNotes, 
    sortedNotes,
    loadNotes, 
    updateNoteContent, 
    updateNoteTitle,
    createEmptyNote,
    selectNote,
    deleteNote } = 
  useNotesStore(noteService);

  const VALID_FILENAME_REGEX = /^[a-zA-Z0-9_.\- )(]{1,255}$/;

  useEffect(() => {
    noteService.initNotes().then(loadNotes);
  }, [noteService, loadNotes]);

  // auto save and rename logic
  useEffect(() => {
    if (!currentNote.title.trim()) return;

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await noteService.save(currentNote, originalFilename);
        setOriginalFilename(currentNote.title);
      } catch (error) {
        console.error('Autosave failed:', error);
      } finally {
        setIsSaving(false);
    }
  }, 1000);

  return () => clearTimeout(timeout);
  }, [currentNote.title, currentNote.content, originalFilename, noteService]);

  // Handlers (thin wrappers)
  const removeNote = useCallback(async ({id}: {id:string}) => {
    await deleteNote(id);
  }, [deleteNote]);

  const handleNoteTitleUpdate = useCallback((id: string, newTitle: string) => {
    if (currentNote.id === id) {
      setOriginalFilename(currentNote.title);
      setCurrentNote((prev) => ({...prev, title: newTitle}));
    }
    updateNoteTitle(id, newTitle);
  }, [currentNote.id, currentNote.title, updateNoteTitle]);

  const selectNoteHandler = useCallback((id: string) => {
    const note = selectNote(id);
    if (note) {
      setCurrentNote(note);
      setOmniBarValue(note.title);
      setOriginalFilename(note.title);
    }
  }, [selectNote]);


  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const editOmniBar = useCallback((value: string) => {
      if (value && !VALID_FILENAME_REGEX.test(value)) return;
    filterNotes(value)
    setOmniBarValue(value);

  }, [filterNotes])

  const createNoteFromOmniBar = useCallback((value: string) => {
    if (value !== "") return;
    const newNote = createEmptyNote()
    setCurrentNote(newNote)
    setOmniBarValue(newNote.title)
  }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && omniBarValue === "") {
      e.preventDefault();
      createNoteFromOmniBar("")
    }
  }, [omniBarValue, createNoteFromOmniBar]);


  return (
    <>
      <main className="">

        <OmniBar
          editOmniBar={editOmniBar}
          omniBarValue={omniBarValue}
          createNoteFromOmniBar={createNoteFromOmniBar}
          handleKeyDown={handleKeyDown}>
        </OmniBar>

        <div style={{ padding: '20px' }}>
          {isSaving && ' 💾 '}
          {currentNote.title && <div style={{ fontSize: '12px', color: 'green' }}>
            Saved: {currentNote.title.split('/').pop()}
          </div>}
        </div>

        <div className="note-taker-wrapper">

          <div className="current-note-wrapper column column-right">
            <CurrentNote
              currentNote={currentNote}
              setCurrentNote={setCurrentNote}
              updateNoteContent={updateNoteContent}
              createEmptyNote={createEmptyNote}
            >
            </CurrentNote>

          </div>

          <div className="notes-list-wrapper column column-left">
            <Notes 
              notes={filteredNotes.length ? filteredNotes : sortedNotes} 
              inputRefs={inputRefs}
              selectNote={selectNoteHandler}
              handleNoteTitleUpdate={handleNoteTitleUpdate}
              currentNoteId={currentNote.id}
              deleteNote={removeNote}
              > 
              </Notes>
          </div>
        </div>

      </main>
    </>
  );
}

