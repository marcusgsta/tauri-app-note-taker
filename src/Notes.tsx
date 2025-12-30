import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from "react"
import { showContextMenu } from "./contextMenu"
import { Note } from "./types"

interface NotesProps {
    notes: Note[];
    selectNote: (id: string) => void;
    handleNoteTitleUpdate: (id: string, title: string) => void;
    inputRefs: React.RefObject<(HTMLInputElement | null)[]>;
}

export const Notes = memo(({ notes, selectNote, handleNoteTitleUpdate, inputRefs }
    : NotesProps) => {

    interface NoteItemProps {
        note: Note;
    }

    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

    const findInputByNoteId = (noteId: string): HTMLInputElement | null => {
        const noteIndex = notes.findIndex(note => note.id === noteId);
        if (noteIndex === -1) return null;
        
        return inputRefs.current[noteIndex] || null;
      }

    const focusEditableNote = ({id}: {id: string}) => {
        setEditingNoteId(id);

        // Focus after re-render
        setTimeout(() => {
            const input = findInputByNoteId(id);
            input?.focus();
        }, 0);  // Next tick after state update
    }

    const EditableNoteItem = forwardRef<HTMLInputElement, NoteItemProps & {
        isEditing: boolean,
        onEditStart: () => void,
        onEditEnd: () => void }>(
        ({note, isEditing,onEditStart, onEditEnd}, ref) => {

        const localRef = useRef<HTMLInputElement>(null);
        const [editValue, setEditValue] = useState(note.title);

        useEffect(() => {
            if (isEditing) {
                setEditValue(note.title);
            }
        }, [isEditing, note.title]);

        useEffect(() => {
            if (isEditing && localRef.current) {
                localRef.current.focus();
                localRef.current.select();
            }
        }, [isEditing]);

        const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            showContextMenu(e, note, focusEditableNote, onEditStart);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                handleNoteTitleUpdate(note.id, localRef.current!.value);
                onEditEnd();
            } else if (e.key === "Escape") {
                onEditEnd();
            }
        }

        const handleBlur = () => {
            if (isEditing && localRef.current) {
                handleNoteTitleUpdate(note.id, (localRef.current.value));
                onEditEnd();
            }
        }

        useImperativeHandle(ref, () => localRef.current!);
                
        
        return (
            <li key={note.id}>
                <input 
                ref={localRef}
                type="text"
                className="editable-note"
                value={isEditing ? editValue : note.title}
                readOnly={editingNoteId !== note.id}
                onChange={isEditing ? (e) => setEditValue(e.target.value) : undefined}
                onClick={!isEditing ? () => selectNote(note.id) : undefined }
                onBlur={handleBlur}
                onKeyDown={isEditing ? handleKeyDown : undefined}
                onContextMenu={handleContextMenu}
                >
                </input>
            </li>
        )
    })

    const notesList = notes.map((note, index) => (
            <EditableNoteItem
            isEditing={editingNoteId === note.id}
            onEditStart={() => setEditingNoteId(note.id)}
            onEditEnd={() => setEditingNoteId(null)}
            ref={(el: HTMLInputElement | null) => {
                inputRefs.current[index] = el;
            }}
            key={note.id}
            note={note}
            />
    ));
  
    return (
      <ul className="notes-list" role="list">
        {notesList}
      </ul>
    )
  });