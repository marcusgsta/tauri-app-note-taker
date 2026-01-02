import { forwardRef, memo, ReactNode, useEffect, useImperativeHandle, useRef, useState } from "react"
import { showContextMenu } from "./contextMenu"
import { Note } from "./types"

interface NotesProps {
    notes: Note[];
    selectNote: (id: string) => void;
    handleNoteTitleUpdate: (id: string, title: string) => void;
    inputRefs: React.RefObject<(HTMLInputElement | null)[]>;
    currentNoteId: string;
}

interface NoteItemProps {
    note: Note;
    isEditing: boolean;
    onEditStart: () => void;
    onEditEnd: () => void;
    handleNoteTitleUpdate: (id: string, title: string) => void;
}

function NotesComponent({ 
    notes, 
    selectNote, 
    handleNoteTitleUpdate, 
    inputRefs,
    currentNoteId,
} : NotesProps): ReactNode {
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

    const findInputByNoteId = (noteId: string): HTMLInputElement | null => {
        const noteIndex = notes.findIndex(note => note.id === noteId);
        return noteIndex !== -1 ? inputRefs.current[noteIndex] || null : null;
      }

    const focusEditableNote = ({id}: {id: string}) => {
        setEditingNoteId(id);
        selectNote(id)
        setTimeout(() => {
            const input = findInputByNoteId(id);
            input?.focus();
        }, 0);
    };

    const EditableNoteItem = forwardRef<HTMLInputElement, NoteItemProps>(
        ({
        note,
        isEditing,
        onEditStart,
        onEditEnd,
        handleNoteTitleUpdate,
        }, ref) => {

        const localRef = useRef<HTMLInputElement>(null);
        const [editValue, setEditValue] = useState(note.title);

        useEffect(() => {
            if (isEditing) {
                setEditValue(note.title);
                if (localRef.current) {
                    localRef.current?.focus();
                    localRef.current?.select();
                }
            }
        }, [isEditing, note.title]);

        const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            showContextMenu(e, note, focusEditableNote);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && localRef.current) {
                handleNoteTitleUpdate(note.id, localRef.current.value);
                onEditEnd();
            } else if (e.key === "Escape") {
                onEditEnd();
            }
        }

        const handleBlur = () => {
            if (isEditing && localRef.current) {
                handleNoteTitleUpdate(note.id, localRef.current.value);
                onEditEnd();
            }
        }

        useImperativeHandle(ref, () => localRef.current as HTMLInputElement);
                
        return (
            <li key={note.id}>
                <input 
                ref={localRef}
                type="text"
                className={currentNoteId === note.id ? `editable-note selected-note` : `editable-note`}
                value={isEditing ? editValue : note.title}
                readOnly={!isEditing}
                onChange={isEditing ? (e) => setEditValue(e.target.value) : undefined}
                onClick={!isEditing ? () => selectNote(note.id) : undefined }
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onContextMenu={handleContextMenu}
                />
            </li>
            );
        }
    );

    EditableNoteItem.displayName = "EditableNoteItem";

    const notesList = notes.map((note, index) => (
            <EditableNoteItem
                isEditing={editingNoteId === note.id}
                onEditStart={() => setEditingNoteId(note.id)}
                onEditEnd={() => setEditingNoteId(null)}
                ref={(el: HTMLInputElement | null) => {
                    inputRefs.current[index] = el;
                }}
                handleNoteTitleUpdate={handleNoteTitleUpdate}
                key={note.id}
                note={note}
            />
    ));
  
    return (
      <ul className="notes-list" role="list">
        {notesList}
      </ul>
    )
  }

  export const Notes = memo(NotesComponent);
  NotesComponent.displayName = "Notes";