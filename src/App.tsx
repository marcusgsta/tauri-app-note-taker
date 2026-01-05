
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { OmniBar } from "./OmniBar";
import { Note } from "./types";
import { Notes } from "./Notes";
import { CurrentNote } from "./CurrentNote";
import { createUniqueId } from "./utils";
import  TauriNoteService from "./TauriNoteService";

export default function Home() {

  const noteService = useMemo(() => new TauriNoteService(), []);

  const VALID_FILENAME_REGEX = /^[a-zA-Z0-9_.\- )(]{1,255}$/;

  const [currentNote, setCurrentNote] = useState<Note>({
    id: "",
    title: "",
    content: "",
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [omniBarValue, setOmniBarValue] = useState('');
  const [originalFilename, setOriginalFilename] = useState('');

  const loadNotes = useCallback(async () => {
      const loadedNotes = await noteService.loadAll();
      setNotes(loadedNotes);
  }, [noteService])

  useEffect(() => {
    // create directory
    noteService.initNotes().then(() => {
      loadNotes();
    })
  }, [noteService, loadNotes])

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


  const handleNoteTitleUpdate = (id: string, newTitle: string) => {
    if (currentNote.id === id) {
      setOriginalFilename(currentNote.title);

      setCurrentNote(prev => prev ? {...prev, title: newTitle} : prev)
    }
    updateNoteTitle(id, newTitle);
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log("omnibarvalue", omniBarValue)
    if (e.key === "Enter" && omniBarValue === "") {
      e.preventDefault();
      createNoteFromOmniBar(omniBarValue)
    }
  }, []);


  const updateNoteContent = (
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
  };

  const updateNoteTitle = (
    id: string,
    title: string) => {

    setNotes((prevNotes: Note[]) =>
      prevNotes.map((note: Note) =>
        note.id === id
          ? { ...note, title }
          : note
      )
    );
  };


  function selectNote(id: string) {

    const note = notes.find((note) => note.id === id);

    setCurrentNote(note ?? {
      id: "",
      title: "",
      content: "",
    });

    setOmniBarValue(note ? note.title : "");
    setOriginalFilename(note ? note.title : "");
  }

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  

  const editOmniBar = useCallback((value: string) => {
    
      if (value !== "" && !VALID_FILENAME_REGEX.test(value)) {
      return;
    }
    
    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(value.toLowerCase()
      ))
      console.log("notes", notes)
    console.log("filtered", filtered)  
    setFilteredNotes(filtered);
    setOmniBarValue(value);
    console.log("filteredNotes", filteredNotes)

  }, [notes])

  const createNoteFromOmniBar = useCallback((value: string) => {
    if (value !== "") return;
    createEmptyNote()
  }, [])

  const createEmptyNote = useCallback(() => {

    let id = createUniqueId();
    
    const newNote = {
      id: id,
      title: id,
      content: ''
    }
    
    setNotes((prevNotes: Note[]) => {
      const exists = prevNotes.find(note => note.id === id);
      if (exists) {
        console.log("ID collision, adding one minute");
        let prevNotesId = parseInt(exists.id) + 1;
        id = prevNotesId.toString();
        newNote.id = id;
        newNote.title = id;
        console.log(newNote)
      }

      return [...prevNotes, newNote]
    });
    setCurrentNote(newNote)
    setOmniBarValue(newNote.title)

  }, [])

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const idA = parseInt(a.id.match(/(\d+)/)?.[1] || '0');
      const idB = parseInt(b.id.match(/(\d+)/)?.[1] || '0');
      return idB - idA;
    })
  }, [notes]);

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
              notes={filteredNotes.length > 0 ? filteredNotes : sortedNotes} 
              inputRefs={inputRefs}
              selectNote={selectNote}
              handleNoteTitleUpdate={handleNoteTitleUpdate}
              currentNoteId={currentNote.id}
              > 
              </Notes>
          </div>
        </div>

      </main>
    </>
  );
}






