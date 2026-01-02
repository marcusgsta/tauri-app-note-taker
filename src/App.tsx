
import { useCallback, useEffect, useRef, useState } from "react";

import {
  rename,
  writeTextFile,
  readDir,
  BaseDirectory,
  mkdir,
  readTextFile
} from '@tauri-apps/plugin-fs';


import { OmniBar } from "./OmniBar";
import { Note } from "./types";
import { Notes } from "./Notes";

export default function Home() {

  const [currentNote, setCurrentNote] = useState<Note>({
    id: "",
    title: "",
    content: "",
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [omniBarValue, setOmniBarValue] = useState('');
  const [originalFilename, setOriginalFilename] = useState('');
  const [hasPendingSave, setHasPendingSave] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      const notesList: Note[] = [];
      try {
        const files = await readDir('note-taker/', {
          baseDir: BaseDirectory.Document,
        });


        for (const file of files) {
          if (file.name?.endsWith('.txt') && !file.isDirectory) {
            try {
              const content = await readTextFile(`note-taker/${file.name}`, {
                baseDir: BaseDirectory.Document
              })
              notesList.push({
                id: file.name.slice(0,12),
                title: file.name.slice(0, -4),
                content: content,
              });
            } catch (error) {
              console.error(`Could not read ${file.name}:`, error);
            }
          }
        }
        setNotes(notesList);
      } catch (error) {
        console.log('No notes or folder missing', error);
      }
    };
    loadNotes();
  }, [])


  const initNotes = useCallback(async () => {
    try {
      await mkdir('note-taker/', {
        baseDir: BaseDirectory.Document,
        recursive: true
      });
    } catch (error) {
      console.log('Notes folder OK or already exists', error);
    }
  }, []);

  useEffect(() => {
    initNotes();
  }, [initNotes]);


  // auto save and rename logic
  useEffect(() => {
    if (!currentNote.title.trim()) return;

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        const path = `note-taker/${currentNote.title}.txt`;
        // Always try rename first if we have an original filename
      if (originalFilename && originalFilename !== currentNote.title) {
        try {
          await rename(
            `note-taker/${originalFilename}.txt`,
            path,
            { oldPathBaseDir: BaseDirectory.Document, newPathBaseDir:
              BaseDirectory.Document }
          );
        } catch (e) {
        console.log('No old file to rename, creating new', e)
      }
    }

    await writeTextFile(path, currentNote.content, { baseDir:
      BaseDirectory.Document 
    });
        setOriginalFilename(currentNote.title);
    } finally {
        setIsSaving(false);
    }
  }, 1000);

  return () => clearTimeout(timeout);
  }, [currentNote.content, currentNote.title, originalFilename]);


  const handleNoteTitleUpdate = (id: string, newTitle: string) => {
    if (currentNote.id === id) {
      setOriginalFilename(currentNote.title);

      setCurrentNote(prev => prev ? {...prev, title: newTitle} : prev)
    }
    updateNoteTitle(id, newTitle);
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
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

  function createUniqueId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = padZero(now.getMonth() + 1);
    const day = padZero(now.getDate());
    const min = now.getMinutes();
    const sec = now.getSeconds();

    return `${year}${month}${day}${min}${sec}`
  }

  function padZero(dayOrMonth: number) {
    let dayOrMonthString: string = dayOrMonth.toString()
    return dayOrMonthString.length == 1 ? `0${dayOrMonthString}` : dayOrMonthString;
  }

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const VALID_FILENAME_REGEX = /^[a-zA-Z0-9_.\- )(]{1,255}$/;

  const editOmniBar = useCallback((value: string) => {
    
      if (value !== "" && !VALID_FILENAME_REGEX.test(value)) {
      return;
    }
    
    // search notes
    const filteredNotes = notes.filter(note =>
      note.title.toLowerCase().includes(value.toLowerCase()
      ))
    
    setNotes(filteredNotes);

    setOmniBarValue(value);
  }, [])

  const createNoteFromOmniBar = useCallback((value: string) => {

    if (value !== "") return;

    createEmptyNote()

  }, [])

  const createEmptyNote = useCallback(() => {

    const id = createUniqueId();
    const newNote = {
      id: id,
      title: id,
      content: ''
    }
    setNotes((prevNotes: Note[]) => [...prevNotes, newNote])
    setCurrentNote(newNote)
    setOmniBarValue(newNote.title)

  }, [])


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
              notes={notes} 
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

function CurrentNote({ currentNote, setCurrentNote, updateNoteContent, createEmptyNote }:
  {
    currentNote: Note,
    setCurrentNote: any,
    updateNoteContent: any
    createEmptyNote: any
  }) {
  return (
    <>
      <textarea
        className="current-note"
        value={currentNote.content || ''}
        onChange={(e) => {
          const newContent = e.target.value;
          if (currentNote) {
            updateNoteContent(currentNote.id, currentNote.title, newContent); // autosave
            setCurrentNote((prev: Note) => prev ? { ...prev, content: e.target.value }
              : null)
          }
        }
        }>
      </textarea>
      <button type="button" onClick={createEmptyNote}>Ny anteckning</button>
    </>
  )
}





