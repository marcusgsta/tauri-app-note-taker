import { useCallback, useMemo, useRef, useState } from "react";
import { Note } from "./types";


export function CurrentNote({
  currentNote,
  setCurrentNote,
  updateNoteContent,
  notes,
  openNoteByTitle }:
  {
    currentNote: Note,
    setCurrentNote: any,
    updateNoteContent: any,
    notes: Note[],
    openNoteByTitle: (title: string) => void,
  }) {
  const normalize = (str: string) => str.normalize('NFC');

  const [showWikiDropdown, setShowWikiDropdown] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // filter notes based on what user writes after [[
  const filteredNotes: Note[] = useMemo(() => {
    if (!wikiQuery.trim()) return notes?.slice(0, 8);

    return notes
      ?.filter(note => normalize(note.title).toLowerCase()
      .includes(normalize(wikiQuery).toLowerCase())
      )
      .slice(0, 8);
  }, [notes, wikiQuery]);

  // check cursor position and if [[ exists
  const checkWikiTrigger = useCallback((e?: React.FormEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const currentText = e ? e.currentTarget.value : ta.value;
    const cursorPos = ta.selectionStart;
    const textBeforeCursor = currentText.slice(0, cursorPos);
    const match = textBeforeCursor.match(/\[+\[([^\]\n]*)$/);
    
    if (match) {
      setWikiQuery(match[1]);
      setShowWikiDropdown(true);
      return true;
    } else {
      setShowWikiDropdown(false);
      return false;
    }
  }, [currentNote.content]);

  // insert chosen note and close dropdown
  const insertWikiLink = useCallback((title: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const cursorPos = ta.selectionStart;
    const before = currentNote.content.slice(0, cursorPos);
    const after = currentNote.content.slice(cursorPos);

    // find [[position and replace with [[title]]
    const newContent = before.replace(/\[+\[[^\]\n]*$/, `[[${title}]]`) + after;

    updateNoteContent(currentNote.id, currentNote.title, newContent);
    setCurrentNote((prev: Note) => prev ? { ...prev, content: newContent } : null);
    setShowWikiDropdown(false);
    setWikiQuery('');

    // set cursor after ]]
    const newCursorPos = newContent.indexOf(']]', cursorPos) + 2;
    setTimeout(() => ta.setSelectionRange(newCursorPos, newCursorPos), 0);
  }, [currentNote, updateNoteContent, setCurrentNote]);

  const content = currentNote?.content ?? "";

  const renderWithWikiLinks = (text: string) => {
    const parts = text.split(/(\[\[[^\]]+\]\])/g)
    return parts.map((part, i) => {
      const match = part.match(/^\[\[([^\]]+)\]\]$/);
      if (!match) return <span key={i}>{part}</span>;
      const title = match[1];
      return (
        <span
          key={i}
          className="wikilink"
          onMouseDown={(e) => {
            e.preventDefault();
            openNoteByTitle(title);
          }}
        >
          {`[[${title}]]`}
        </span>
      );
    });
  };

  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      const mirror = textareaRef.current.parentElement?.querySelector('.note-mirror');
      if (mirror) {
        mirror.scrollTop = textareaRef.current.scrollTop;
        mirror.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  }, []);

  return (
    <div className="note-container">
      <div className="note-mirror">
        {renderWithWikiLinks(content)}
      </div>

      <textarea
        ref={textareaRef}
        className="note-textarea"
        value={content}
        onChange={(e) => {
          const newContent = e.target.value;
          if (currentNote) {
            updateNoteContent(currentNote.id, currentNote.title, newContent); // autosave
            setCurrentNote((prev: Note) =>
              prev ? { ...prev, content: e.target.value } : null
            );
          }
        }}
        onInput={(e) => {
          checkWikiTrigger(e); // check [[ for every keystroke
          handleScroll();
        }}
        onScroll={handleScroll}
        onKeyDown={(e) => {
          if (showWikiDropdown && e.key === 'Escape') {
            setShowWikiDropdown(false);
            e.stopPropagation();
          }
          if (showWikiDropdown && e.key === 'ArrowDown') {
            // dropdown navigation here
            e.preventDefault();
          }
        }}
      />
      {showWikiDropdown && (
        <div className="wiki-dropdown">
          <div className="wiki-dropdown-list">
            {filteredNotes?.length ? (
              filteredNotes.map((note: Note) => (
                <div
                  key={note.id}
                  className="wiki-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertWikiLink(note.title);
                  }}
                >
                  <span className="wiki-title">{note.title}</span>
                  {note.content && (
                    <span className="wiki-preview">
                      {note.content.slice(0, 80)}...
                    </span>
                  )}
                </div>
              ))) : (
              <div className="wiki-empty">No note found</div>
            )}
          </div>
        </div>
      )}
    </div>)}
