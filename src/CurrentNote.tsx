import { Note } from "./types";

export function CurrentNote({ currentNote, setCurrentNote, updateNoteContent, createEmptyNote }:
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
